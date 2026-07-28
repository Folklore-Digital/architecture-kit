import { loadConfig } from '../config/loadConfig.js';
import { runValidation } from '../validators/index.js';
import type { ValidationLevel } from '../validators/types.js';

export type ValidateOptions = {
  cwd?: string;
  ci?: boolean;
  level?: ValidationLevel;
  since?: string;
};

function formatIssue(level: ValidationLevel, message: string): string {
  const prefix = level === 'error' ? 'ERROR' : 'WARN';
  return `[${prefix}] ${message}`;
}

export async function runValidate(options: ValidateOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const level = options.level ?? (options.ci ? 'error' : 'warn');

  let config;
  try {
    ({ config } = await loadConfig(cwd));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const result = await runValidation(cwd, config, {
    since: options.since,
    ci: options.ci,
  });
  const visibleIssues = result.issues.filter((issue) => {
    if (level === 'error') {
      return issue.level === 'error';
    }
    return true;
  });

  if (visibleIssues.length === 0) {
    console.log('Architecture docs validation passed.');
    return 0;
  }

  for (const issue of visibleIssues) {
    console.log(formatIssue(issue.level, issue.message));
  }

  const errors = visibleIssues.filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    console.log('');
    console.log(`Validation failed with ${errors.length} error(s).`);
    return 1;
  }

  console.log('');
  console.log(`Validation completed with ${visibleIssues.length} warning(s).`);
  return options.ci ? 1 : 0;
}
