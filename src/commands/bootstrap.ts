import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tryLoadConfig } from '../config/loadConfig.js';
import type { ArchitectureConfig } from '../config/schema.js';
import {
  formatAgentContext,
  scanProject,
  type ProjectScanResult,
} from '../scan/projectScan.js';
import { ensureDir, writeJson } from '../utils/fileSystem.js';

export type RunScanOptions = {
  cwd?: string;
  json?: boolean;
  out?: string;
};

export async function runScan(options: RunScanOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  let config: ArchitectureConfig | null = null;

  const loaded = await tryLoadConfig(cwd);
  config = loaded?.config ?? null;

  const scan = await scanProject(cwd, config);

  if (options.json) {
    console.log(JSON.stringify(scan, null, 2));
    return 0;
  }

  printScanSummary(scan);

  const outPath =
    options.out ??
    path.join(cwd, '.architecture-kit', 'agent-context.md');
  await ensureDir(path.dirname(outPath));
  await writeFile(outPath, formatAgentContext(scan, cwd), 'utf-8');
  console.log(`\nAgent context written to ${path.relative(cwd, outPath)}`);

  return 0;
}

function printScanSummary(scan: ProjectScanResult): void {
  console.log(`Project: ${scan.projectName}`);
  console.log(
    `Suggested type: ${scan.suggestedType} (${scan.detectionConfidence})`,
  );
  console.log(`Architecture docs: ${scan.existingDocs.architectureDocCount}`);
  console.log(`ADRs: ${scan.existingDocs.adrCount}`);
  console.log(`Diagrams: ${scan.existingDocs.diagramCount}`);

  if (scan.existingDocs.missingRecommended.length > 0) {
    console.log(
      `Missing recommended: ${scan.existingDocs.missingRecommended.join(', ')}`,
    );
  }

  if (scan.suggestedIntegrations.length > 0) {
    console.log(`Integrations detected: ${scan.suggestedIntegrations.join(', ')}`);
  }

  if (scan.storybookDetected) {
    console.log('Storybook: detected (optional — enable in config if used)');
  }
}

export type RunBootstrapOptions = {
  cwd?: string;
  apply?: boolean;
  type?: string;
};

export async function runBootstrap(
  options: RunBootstrapOptions = {},
): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const { runInit } = await import('../commands/init.js');

  const loaded = await tryLoadConfig(cwd);
  const config = loaded?.config ?? null;

  const scan = await scanProject(cwd, config);
  const projectType =
    options.type && options.type !== 'auto'
      ? (options.type as ArchitectureConfig['project']['type'])
      : scan.suggestedType;

  console.log('Architecture Kit — bootstrap');
  console.log('─'.repeat(40));
  printScanSummary(scan);

  const contextPath = path.join(cwd, '.architecture-kit', 'agent-context.md');
  const jsonPath = path.join(cwd, '.architecture-kit', 'scan.json');

  await ensureDir(path.dirname(contextPath));
  await writeFile(contextPath, formatAgentContext(scan, cwd), 'utf-8');
  await writeJson(jsonPath, scan);
  console.log(`\nWrote ${path.relative(cwd, contextPath)}`);
  console.log(`Wrote ${path.relative(cwd, jsonPath)}`);

  if (!options.apply) {
    console.log('\nDry run. Re-run with --apply to scaffold missing docs and update config.');
    console.log('Give agent-context.md to your AI agent to fill documentation.');
    return 0;
  }

  const hasDocs = scan.existingDocs.hasArchitectureDocs;
  if (!hasDocs || scan.existingDocs.architectureDocCount === 0) {
    console.log(`\nScaffolding docs (--type ${projectType})...`);
    await runInit({
      type: projectType,
      cwd,
      name: scan.projectName,
    });
  } else {
    console.log('\nExisting docs found — skipping init (non-destructive).');
  }

  if (config) {
    await mergeDetectedIntoConfig(cwd, config, scan);
  } else {
    const loaded = await tryLoadConfig(cwd);
    if (loaded) {
      await mergeDetectedIntoConfig(cwd, loaded.config, scan);
    }
  }

  console.log('\nBootstrap complete. Next:');
  console.log('  1. Review .architecture-kit/agent-context.md (or hand to AI agent)');
  console.log('  2. Fill docs/architecture/*.md placeholders');
  console.log('  3. npx architecture-kit validate');
  return 0;
}

async function mergeDetectedIntoConfig(
  cwd: string,
  config: ArchitectureConfig,
  scan: ProjectScanResult,
): Promise<void> {
  const { writeJson } = await import('../utils/fileSystem.js');
  const configPath = path.join(cwd, 'architecture.config.json');
  let changed = false;

  const stack = { ...config.stack };
  if (!stack.packageManager) {
    const pm = scan.findings.find((f) => f.label === 'Package manager');
    if (pm?.value === 'Yarn') {
      stack.packageManager = 'yarn';
      changed = true;
    } else if (pm?.value === 'pnpm') {
      stack.packageManager = 'pnpm';
      changed = true;
    } else if (pm?.value === 'npm') {
      stack.packageManager = 'npm';
      changed = true;
    }
  }

  if (scan.storybookDetected && !config.storybook?.enabled) {
    config.storybook = {
      enabled: true,
      url: 'http://localhost:6006',
    };
    changed = true;
    console.log('Set storybook.enabled=true (detected Storybook — adjust url in config)');
  }

  if (changed) {
    await writeJson(configPath, { ...config, stack });
    console.log('Updated architecture.config.json with detected values');
  }
}
