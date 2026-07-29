import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ArchitectureConfig } from '../config/schema.js';
import { resolveSiteOutputDir } from '../config/sitePaths.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

const execFileAsync = promisify(execFile);

export async function validateDeployPaths(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const outputDir = resolveSiteOutputDir(config);
  const outputPath = path.join(cwd, outputDir);

  if (!(await pathExists(outputPath))) {
    return issues;
  }

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-files', '--', outputDir],
      { cwd },
    );
    const tracked = stdout
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (tracked.length > 0) {
      issues.push({
        level: 'warn',
        code: 'built-site-tracked-in-git',
        message: `Built architecture site is tracked in git (${tracked.length} file(s) under ${outputDir}) — add to .gitignore; source of truth is markdown in ${config.paths.docs}/`,
      });
    }
  } catch {
    // Not a git repo or git unavailable — skip
  }

  return issues;
}
