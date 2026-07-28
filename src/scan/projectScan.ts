import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ArchitectureConfig, ProjectType } from '../config/schema.js';
import { detectProjectType } from '../detect/projectType.js';
import { pathExists } from '../utils/fileSystem.js';

const execFileAsync = promisify(execFile);

export type ScanFinding = {
  category: string;
  label: string;
  value: string;
};

export type ProjectScanResult = {
  scannedAt: string;
  projectName: string;
  suggestedType: ProjectType;
  detectionConfidence: 'high' | 'medium' | 'low';
  detectionSignals: string[];
  findings: ScanFinding[];
  existingDocs: {
    hasConfig: boolean;
    hasArchitectureDocs: boolean;
    architectureDocCount: number;
    adrCount: number;
    diagramCount: number;
    missingRecommended: string[];
  };
  suggestedIntegrations: string[];
  envVarKeys: string[];
  storybookDetected: boolean;
};

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function depNames(pkg: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const section = pkg[key];
    if (section && typeof section === 'object') {
      for (const name of Object.keys(section as Record<string, unknown>)) {
        names.add(name);
      }
    }
  }
  return names;
}

async function countFiles(dir: string, ext: string): Promise<number> {
  if (!(await pathExists(dir))) {
    return 0;
  }
  let count = 0;
  async function walk(d: string): Promise<void> {
    const entries = await readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith(ext)) {
        count += 1;
      }
    }
  }
  await walk(dir);
  return count;
}

const INTEGRATION_SIGNALS: Array<{ dep: string; name: string; type: string }> = [
  { dep: 'contentful', name: 'Contentful', type: 'cms' },
  { dep: '@contentful/rich-text-react-renderer', name: 'Contentful', type: 'cms' },
  { dep: 'stripe', name: 'Stripe', type: 'payments' },
  { dep: '@stripe/stripe-js', name: 'Stripe', type: 'payments' },
  { dep: '@sentry/nextjs', name: 'Sentry', type: 'observability' },
  { dep: '@vercel/analytics', name: 'Vercel Analytics', type: 'analytics' },
  { dep: 'phaser', name: 'Phaser', type: 'game-engine' },
  { dep: '@sanity/client', name: 'Sanity', type: 'cms' },
  { dep: 'shopify-buy', name: 'Shopify', type: 'commerce' },
];

export async function scanProject(
  cwd: string,
  config?: ArchitectureConfig | null,
): Promise<ProjectScanResult> {
  const detection = await detectProjectType(cwd);
  const findings: ScanFinding[] = [];
  const suggestedIntegrations: string[] = [];

  const pkgPath = path.join(cwd, 'package.json');
  const pkg = (await readJsonFile(pkgPath)) as Record<string, unknown> | null;
  const deps = pkg ? depNames(pkg) : new Set<string>();

  const projectName =
    config?.project.name ??
    (typeof pkg?.name === 'string' ? pkg.name : path.basename(cwd));

  if (pkg) {
    if (deps.has('next')) {
      findings.push({ category: 'stack', label: 'Frontend', value: 'Next.js' });
    }
    if (deps.has('react')) {
      findings.push({ category: 'stack', label: 'UI', value: 'React' });
    }
    if (deps.has('phaser')) {
      findings.push({ category: 'stack', label: 'Game', value: 'Phaser' });
    }

    const scripts = pkg.scripts;
    if (scripts && typeof scripts === 'object') {
      for (const [name, cmd] of Object.entries(scripts as Record<string, string>)) {
        if (/storybook/i.test(name) || /storybook/i.test(cmd)) {
          findings.push({
            category: 'tooling',
            label: 'Storybook script',
            value: `${name}: ${cmd}`,
          });
        }
      }
    }
  }

  if (await pathExists(path.join(cwd, 'yarn.lock'))) {
    findings.push({ category: 'tooling', label: 'Package manager', value: 'Yarn' });
  } else if (await pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    findings.push({ category: 'tooling', label: 'Package manager', value: 'pnpm' });
  } else if (await pathExists(path.join(cwd, 'package-lock.json'))) {
    findings.push({ category: 'tooling', label: 'Package manager', value: 'npm' });
  }

  if (await pathExists(path.join(cwd, 'composer.json'))) {
    findings.push({ category: 'stack', label: 'PHP', value: 'Composer project' });
  }
  if (await pathExists(path.join(cwd, 'wp-content'))) {
    findings.push({ category: 'stack', label: 'CMS', value: 'WordPress (wp-content/)' });
  }
  if (await pathExists(path.join(cwd, 'vercel.json'))) {
    findings.push({ category: 'hosting', label: 'Deploy', value: 'Vercel (vercel.json)' });
  }

  for (const signal of INTEGRATION_SIGNALS) {
    if (deps.has(signal.dep)) {
      suggestedIntegrations.push(`${signal.name} (${signal.type})`);
    }
  }

  const storybookDetected =
    deps.has('storybook') ||
    deps.has('@storybook/react') ||
    deps.has('@storybook/nextjs') ||
    deps.has('@storybook/react-vite') ||
    findings.some((f) => f.label === 'Storybook script');

  const envExamplePath = path.join(cwd, '.env.example');
  let envVarKeys: string[] = [];
  if (await pathExists(envExamplePath)) {
    const envExample = await readFile(envExamplePath, 'utf-8');
    envVarKeys = [...envExample.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)].map(
      (m) => m[1] ?? '',
    );
    findings.push({
      category: 'config',
      label: 'Environment variables',
      value: `${envVarKeys.length} keys in .env.example`,
    });
  }

  const archDir = path.join(
    cwd,
    config?.paths.architectureDocs ?? 'docs/architecture',
  );
  const adrDir = path.join(cwd, config?.paths.adr ?? 'docs/adr');
  const diagramsDir = path.join(cwd, config?.paths.diagrams ?? 'docs/diagrams');

  const recommended = ['overview.md', 'deployment.md', 'ai-context.md', 'documentation-map.md'];
  const missingRecommended: string[] = [];
  for (const doc of recommended) {
    if (!(await pathExists(path.join(archDir, doc)))) {
      missingRecommended.push(doc);
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    projectName,
    suggestedType: detection.suggested,
    detectionConfidence: detection.confidence,
    detectionSignals: detection.signals.map((s) => s.label),
    findings,
    existingDocs: {
      hasConfig: await pathExists(path.join(cwd, 'architecture.config.json')),
      hasArchitectureDocs: await pathExists(archDir),
      architectureDocCount: await countFiles(archDir, '.md'),
      adrCount: await countFiles(adrDir, '.md'),
      diagramCount: await countFiles(diagramsDir, '.mmd'),
      missingRecommended,
    },
    suggestedIntegrations,
    envVarKeys,
    storybookDetected,
  };
}

export function formatAgentContext(
  scan: ProjectScanResult,
  cwd: string,
): string {
  const rel = (p: string) => p.replace(cwd, '.').replace(/^\.\/?/, '') || '.';

  const lines = [
    '# Architecture bootstrap context',
    '',
    '> Generated by `architecture-kit scan`. Give this file to your AI agent or run `architecture-kit bootstrap --apply`.',
    '',
    `**Scanned:** ${scan.scannedAt}`,
    `**Project:** ${scan.projectName}`,
    `**Suggested type:** \`${scan.suggestedType}\` (${scan.detectionConfidence} confidence)`,
    '',
    '## Detection signals',
    ...scan.detectionSignals.map((s) => `- ${s}`),
    '',
    '## Detected stack & tooling',
    ...scan.findings.map((f) => `- **${f.label}:** ${f.value}`),
    '',
    '## Documentation status',
    `- Config present: ${scan.existingDocs.hasConfig ? 'yes' : 'no'}`,
    `- Architecture docs: ${scan.existingDocs.architectureDocCount} markdown files`,
    `- ADRs: ${scan.existingDocs.adrCount}`,
    `- Diagrams: ${scan.existingDocs.diagramCount}`,
  ];

  if (scan.existingDocs.missingRecommended.length > 0) {
    lines.push(
      '',
      '### Missing recommended docs',
      ...scan.existingDocs.missingRecommended.map((d) => `- \`docs/architecture/${d}\``),
    );
  }

  if (scan.suggestedIntegrations.length > 0) {
    lines.push(
      '',
      '## Suggested integrations (from dependencies)',
      ...scan.suggestedIntegrations.map((i) => `- ${i}`),
      '',
      'Add these to `architecture.config.json` → `integrations` and document in `integrations.md`.',
    );
  }

  if (scan.envVarKeys.length > 0) {
    lines.push(
      '',
      '## Environment variables (.env.example)',
      ...scan.envVarKeys.map((k) => `- \`${k}\``),
      '',
      'Document each in `docs/architecture/environments.md`.',
    );
  }

  if (scan.storybookDetected) {
    lines.push(
      '',
      '## Storybook detected',
      '',
      'Consider enabling optional Storybook in `architecture.config.json`:',
      '',
      '```json',
      '"storybook": {',
      '  "enabled": true,',
      '  "url": "http://localhost:6006",',
      '  "docsPath": ".storybook/README.md"',
      '}',
      '```',
      '',
      'Link Storybook from `documentation-map.md` (UI layer) — do not duplicate component docs here.',
    );
  }

  lines.push(
    '',
    '## AI agent task checklist',
    '',
    'Use this repo root: `' + rel(cwd) + '`',
    '',
    '1. Read `architecture.config.json` (create via `init` if missing).',
    '2. Fill `docs/architecture/overview.md` — purpose, stack, boundaries.',
    '3. Fill `docs/architecture/ai-context.md` — folder map, conventions, what not to change.',
    '4. Fill `docs/architecture/documentation-map.md` — link specs, Storybook, Figma, tickets.',
    '5. Document integrations in `docs/architecture/integrations.md`.',
    '6. Add/update Mermaid diagrams in `docs/diagrams/`.',
    '7. Run `npx architecture-kit validate` and fix reported issues.',
    '',
    '**Do not overwrite existing feature notes** — link to them from `documentation-map.md`.',
  );

  return lines.join('\n');
}

export async function getGitLastModified(
  cwd: string,
  filePath: string,
): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '-1', '--format=%cI', '--', filePath],
      { cwd, timeout: 5000 },
    );
    const date = stdout.trim();
    return date || null;
  } catch {
    return null;
  }
}

export async function getFileModifiedIso(filePath: string): Promise<string> {
  const stats = await stat(filePath);
  return stats.mtime.toISOString();
}

export type DocDates = {
  lastUpdated?: string;
  lastReviewed?: string;
};

export function parseFrontmatterDates(content: string): DocDates {
  if (!content.startsWith('---\n')) {
    return {};
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return {};
  }
  const fm = content.slice(4, end);
  const dates: DocDates = {};
  for (const line of fm.split('\n')) {
    const reviewed = line.match(/^lastReviewed:\s*(.+)$/i);
    const reviewedAlt = line.match(/^reviewed:\s*(.+)$/i);
    const updated = line.match(/^lastUpdated:\s*(.+)$/i);
    if (reviewed?.[1]) {
      dates.lastReviewed = reviewed[1].trim().replace(/^["']|["']$/g, '');
    } else if (reviewedAlt?.[1]) {
      dates.lastReviewed = reviewedAlt[1].trim().replace(/^["']|["']$/g, '');
    }
    if (updated?.[1]) {
      dates.lastUpdated = updated[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return dates;
}

export async function resolveDocDates(
  cwd: string,
  filePath: string,
  source: 'git' | 'file',
): Promise<DocDates> {
  const content = await readFile(filePath, 'utf-8');
  const fromFm = parseFrontmatterDates(content);

  let lastUpdated = fromFm.lastUpdated;
  if (!lastUpdated) {
    if (source === 'git') {
      lastUpdated =
        (await getGitLastModified(cwd, filePath)) ??
        (await getFileModifiedIso(filePath));
    } else {
      lastUpdated = await getFileModifiedIso(filePath);
    }
  }

  return {
    lastUpdated,
    lastReviewed: fromFm.lastReviewed,
  };
}

export function formatDisplayDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
