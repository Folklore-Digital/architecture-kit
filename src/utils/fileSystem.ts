import { access, appendFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDefaultConfig,
  type ProjectType,
} from '../config/schema.js';
import {
  getEmbedDir,
  nextConfigNeedsEmbedReminder,
  readKitVersionRange,
  type EmbedTarget,
} from './embed.js';
import { wrapScaffoldFrontmatter } from './scaffoldFrontmatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '../..');

async function readKitVersion(): Promise<string> {
  try {
    const raw = await readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

export function getTemplatesDir(): string {
  return path.join(PACKAGE_ROOT, 'templates');
}

export function getTemplateDir(type: ProjectType): string {
  return path.join(getTemplatesDir(), type);
}

export async function copyTemplate(
  type: ProjectType,
  targetDir: string,
  created: string[],
): Promise<void> {
  const source = getTemplateDir(type);
  if (!(await pathExists(source))) {
    throw new Error(`Template "${type}" not found at ${source}`);
  }

  await copyTreeSkipExisting(source, targetDir, created, '');
}

async function copyTreeSkipExisting(
  source: string,
  target: string,
  created: string[],
  relativePrefix: string,
): Promise<void> {
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);
    const rel = relativePrefix
      ? `${relativePrefix}/${entry.name}`.replace(/\\/g, '/')
      : entry.name;

    if (entry.isDirectory()) {
      if (!(await pathExists(destPath))) {
        await mkdir(destPath, { recursive: true });
      }
      await copyTreeSkipExisting(srcPath, destPath, created, rel);
      continue;
    }

    if (await pathExists(destPath)) {
      continue;
    }

    await ensureDir(path.dirname(destPath));
    if (entry.name.endsWith('.md')) {
      const raw = await readFile(srcPath, 'utf-8');
      const kitVersion = await readKitVersion();
      await writeFile(destPath, wrapScaffoldFrontmatter(raw, kitVersion), 'utf-8');
    } else {
      await cp(srcPath, destPath);
    }
    created.push(relativePrefix ? rel : entry.name);
  }
}

async function mergePackageJsonFromEmbed(
  cwd: string,
  embedDir: string,
  created: string[],
): Promise<void> {
  const mergePath = path.join(embedDir, 'package.merge.json');
  if (!(await pathExists(mergePath))) {
    return;
  }

  const pkgPath = path.join(cwd, 'package.json');
  if (!(await pathExists(pkgPath))) {
    throw new Error(
      'package.json not found. Run init --embed from your project root.',
    );
  }

  const versionRange = await readKitVersionRange(PACKAGE_ROOT);
  const mergeRaw = await readFile(mergePath, 'utf-8');
  const merge = JSON.parse(
    mergeRaw.replaceAll('{{kitVersionRange}}', versionRange),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  let changed = false;
  pkg.scripts ??= {};
  for (const [key, value] of Object.entries(merge.scripts ?? {})) {
    if (!(key in pkg.scripts)) {
      pkg.scripts[key] = value;
      created.push(`package.json (script: ${key})`);
      changed = true;
    }
  }

  pkg.devDependencies ??= {};
  for (const [key, value] of Object.entries(merge.devDependencies ?? {})) {
    if (!(key in pkg.devDependencies)) {
      pkg.devDependencies[key] = value;
      created.push(`package.json (devDependency: ${key})`);
      changed = true;
    }
  }

  if (changed) {
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  }
}

export async function scaffoldEmbed(
  cwd: string,
  target: EmbedTarget,
): Promise<string[]> {
  const created: string[] = [];
  const embedDir = getEmbedDir(PACKAGE_ROOT, target);

  if (!(await pathExists(embedDir))) {
    throw new Error(`Embed template "${target}" not found at ${embedDir}`);
  }

  const scriptsSource = path.join(embedDir, 'scripts');
  if (await pathExists(scriptsSource)) {
    await copyTreeSkipExisting(
      scriptsSource,
      path.join(cwd, 'scripts'),
      created,
      'scripts',
    );
  }

  await mergePackageJsonFromEmbed(cwd, embedDir, created);

  const embedGuideSource = path.join(embedDir, 'EMBED.md');
  const embedGuideTarget = path.join(
    cwd,
    'docs/architecture/_embed-host-setup.md',
  );
  if (
    (await pathExists(embedGuideSource)) &&
    !(await pathExists(embedGuideTarget))
  ) {
    await ensureDir(path.dirname(embedGuideTarget));
    await cp(embedGuideSource, embedGuideTarget);
    created.push('docs/architecture/_embed-host-setup.md');
  }

  return created;
}

export async function resolveProjectName(cwd: string): Promise<string> {
  try {
    const pkgRaw = await readFile(path.join(cwd, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { name?: string };
    if (pkg.name) {
      return pkg.name.replace(/^@[^/]+\//, '').replace(/-/g, ' ');
    }
  } catch {
    // ignore
  }

  return path.basename(cwd);
}

export async function scaffoldProject(
  cwd: string,
  type: ProjectType,
  projectName?: string,
  options?: { embed?: EmbedTarget },
): Promise<{ created: string[]; skipped: string[]; warnings: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const warnings: string[] = [];
  const name = projectName ?? (await resolveProjectName(cwd));
  const docsDir = path.join(cwd, 'docs');
  const configPath = path.join(cwd, 'architecture.config.json');

  const docsExisted = await pathExists(docsDir);
  if (!docsExisted) {
    await mkdir(docsDir, { recursive: true });
  }

  await copyTemplate(type, docsDir, created);
  if (docsExisted) {
    skipped.push('docs/ (existing files left unchanged)');
  }

  if (!(await pathExists(configPath))) {
    const config = createDefaultConfig(type, name);
    await writeJson(configPath, config);
    created.push('architecture.config.json');
  } else {
    skipped.push('architecture.config.json');
  }

  const cursorRuleSource = path.join(getTemplatesDir(), 'cursor/architecture-kit.mdc');
  const cursorRuleTarget = path.join(cwd, '.cursor/rules/architecture-kit.mdc');
  if (await pathExists(cursorRuleSource)) {
    if (await pathExists(cursorRuleTarget)) {
      skipped.push('.cursor/rules/architecture-kit.mdc');
    } else {
      await ensureDir(path.dirname(cursorRuleTarget));
      const cursorTemplate = await readFile(cursorRuleSource, 'utf-8');
      const cursorRule = cursorTemplate.replaceAll('{{projectName}}', name);
      await writeFile(cursorRuleTarget, cursorRule, 'utf-8');
      created.push('.cursor/rules/architecture-kit.mdc');
    }
  }

  const agentsSnippetSource = path.join(getTemplatesDir(), 'AGENTS.snippet.md');
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (await pathExists(agentsSnippetSource)) {
    const snippet = await readFile(agentsSnippetSource, 'utf-8');
    if (await pathExists(agentsPath)) {
      const existing = await readFile(agentsPath, 'utf-8');
      if (!existing.includes('architecture-kit')) {
        await appendFile(agentsPath, `\n${snippet}`, 'utf-8');
        created.push('AGENTS.md (appended architecture section)');
      } else {
        skipped.push('AGENTS.md (already references architecture-kit)');
      }
    } else {
      await writeFile(agentsPath, `${snippet.trim()}\n`, 'utf-8');
      created.push('AGENTS.md');
    }
  }

  if (options?.embed) {
    const embedCreated = await scaffoldEmbed(cwd, options.embed);
    created.push(...embedCreated);
    if (options.embed === 'nextjs' && (await nextConfigNeedsEmbedReminder(cwd))) {
      warnings.push(
        'Add /architecture redirect to next.config — see docs/architecture/_embed-host-setup.md',
      );
    }
  }

  const prChecklistSource = path.join(getTemplatesDir(), 'PR-CHECKLIST.md');
  const prChecklistTarget = path.join(cwd, 'docs/PR-CHECKLIST.md');
  if (
    (await pathExists(prChecklistSource)) &&
    !(await pathExists(prChecklistTarget))
  ) {
    await cp(prChecklistSource, prChecklistTarget);
    created.push('docs/PR-CHECKLIST.md');
  }

  return { created, skipped, warnings };
}

export function integrationMentioned(
  integrationsMarkdown: string,
  integrationName: string,
): boolean {
  const pattern = new RegExp(
    integrationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i',
  );
  return pattern.test(integrationsMarkdown);
}
