import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '../config/loadConfig.js';
import { projectTypeLabels } from '../config/schema.js';
import { runValidation } from '../validators/index.js';
import { countScaffoldDocs } from '../validators/placeholders.js';

function formatStackValue(value: string | null | undefined): string {
  return value ?? '—';
}

function calculateDocsHealth(
  totalChecks: number,
  issueCount: number,
): number {
  if (totalChecks === 0) {
    return 100;
  }
  const score = Math.round(((totalChecks - issueCount) / totalChecks) * 100);
  return Math.max(0, Math.min(100, score));
}

export async function runDoctor(cwd: string = process.cwd()): Promise<number> {
  let config;
  try {
    ({ config } = await loadConfig(cwd));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const result = await runValidation(cwd, config);
  const errors = result.issues.filter((issue) => issue.level === 'error');
  const warnings = result.issues.filter((issue) => issue.level === 'warn');
  const totalChecks = Math.max(result.issues.length, 1);
  const health = calculateDocsHealth(totalChecks, result.issues.length);

  const adrDir = path.join(cwd, config.paths.adr);
  let adrCount = 0;
  try {
    adrCount = (await readdir(adrDir)).filter((file) => file.endsWith('.md')).length;
  } catch {
    adrCount = 0;
  }

  console.log('Architecture Kit — Doctor Report');
  console.log('================================');
  console.log(`Project: ${config.project.name}`);
  console.log(`Type: ${projectTypeLabels[config.project.type]}`);
  console.log('');
  console.log('Stack');
  console.log(`  Frontend: ${formatStackValue(config.stack.frontend)}`);
  console.log(`  Backend: ${formatStackValue(config.stack.backend)}`);
  console.log(`  CMS: ${formatStackValue(config.stack.cms)}`);
  console.log(`  Database: ${formatStackValue(config.stack.database)}`);
  console.log(`  Hosting: ${formatStackValue(config.stack.hosting)}`);
  console.log(`  Package Manager: ${formatStackValue(config.stack.packageManager)}`);
  console.log('');
  console.log(
    `Integrations: ${
      config.integrations.length > 0
        ? config.integrations.map((item) => item.name).join(', ')
        : 'None configured'
    }`,
  );
  console.log(`ADRs: ${adrCount}`);
  const scaffoldCount = await countScaffoldDocs(cwd, config);
  if (config.project.documentationStatus === 'scaffold' || scaffoldCount > 0) {
    console.log(
      `Documentation status: SCAFFOLD (${scaffoldCount} unreviewed file(s); run scan + customize docs)`,
    );
  } else if (config.project.documentationStatus === 'active') {
    console.log('Documentation status: active');
  }
  console.log(`Docs health: ${health}%`);
  console.log('');

  const aiToolingIssues = result.issues.filter((issue) =>
    ['missing-cursor-rule', 'missing-agents-md', 'agents-missing-architecture-section'].includes(
      issue.code,
    ),
  );

  console.log('AI tooling');
  console.log(
    `  Cursor rule: ${aiToolingIssues.some((i) => i.code === 'missing-cursor-rule') ? 'missing' : 'present'}`,
  );
  console.log(
    `  Agent docs: ${aiToolingIssues.some((i) => i.code === 'missing-agents-md' || i.code === 'agents-missing-architecture-section') ? 'needs update' : 'ok'}`,
  );
  console.log('');

  const missing = [...errors, ...warnings].map((issue) => issue.message);
  if (missing.length === 0) {
    console.log('Missing: None');
  } else {
    console.log('Missing / Issues:');
    for (const item of missing) {
      console.log(`  - ${item}`);
    }
  }

  return errors.length > 0 ? 1 : 0;
}
