import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '../config/loadConfig.js';
import { runValidation } from '../validators/index.js';
import { countScaffoldDocs } from '../validators/placeholders.js';
import type { ValidationIssue } from '../validators/types.js';

export type ArchitectureGapsReport = {
  documentationStatus?: string;
  scaffoldFileCount: number;
  docsHealthPercent: number;
  errorCount: number;
  warningCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  passed: boolean;
};

function calculateDocsHealth(issueCount: number): number {
  if (issueCount === 0) {
    return 100;
  }
  const score = Math.round((1 / (1 + issueCount * 0.15)) * 100);
  return Math.max(0, Math.min(100, score));
}

export async function getArchitectureGaps(
  cwd: string,
): Promise<ArchitectureGapsReport> {
  const { config } = await loadConfig(cwd);
  const result = await runValidation(cwd, config);
  const errors = result.issues.filter((issue) => issue.level === 'error');
  const warnings = result.issues.filter((issue) => issue.level === 'warn');
  const scaffoldFileCount = await countScaffoldDocs(cwd, config);

  return {
    documentationStatus: config.project.documentationStatus,
    scaffoldFileCount,
    docsHealthPercent: calculateDocsHealth(result.issues.length),
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    passed: result.passed,
  };
}

export async function runArchitectureValidation(
  cwd: string,
  options?: { ci?: boolean; since?: string },
): Promise<ArchitectureGapsReport> {
  const { config } = await loadConfig(cwd);
  const result = await runValidation(cwd, config, {
    ci: options?.ci,
    since: options?.since,
  });
  const errors = result.issues.filter((issue) => issue.level === 'error');
  const warnings = result.issues.filter((issue) => issue.level === 'warn');
  const scaffoldFileCount = await countScaffoldDocs(cwd, config);

  return {
    documentationStatus: config.project.documentationStatus,
    scaffoldFileCount,
    docsHealthPercent: calculateDocsHealth(result.issues.length),
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    passed: result.passed && (!options?.ci || warnings.length === 0),
  };
}

export async function countAdrs(cwd: string, adrPath: string): Promise<number> {
  try {
    return (await readdir(path.join(cwd, adrPath))).filter((f) =>
      f.endsWith('.md'),
    ).length;
  } catch {
    return 0;
  }
}
