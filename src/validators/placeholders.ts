import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

/** Patterns that indicate scaffold placeholder content, not finished docs. */
const PLACEHOLDER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b_TBD_\b/i, label: '_TBD_' },
  { pattern: /\b_Example\b/i, label: '_Example_' },
  { pattern: /Replace with/i, label: 'Replace with' },
  { pattern: /What problem are we solving\?/i, label: 'unfilled ADR context' },
  { pattern: /\| _[A-Za-z][^|_]*_ \|/i, label: 'placeholder table row' },
];

async function walkMarkdown(
  dir: string,
  files: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdown(full, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

export async function validatePlaceholders(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const docsRoot = path.join(cwd, config.paths.docs);

  if (!(await pathExists(docsRoot))) {
    return issues;
  }

  const files = await walkMarkdown(docsRoot);

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const relative = path.relative(cwd, filePath).replace(/\\/g, '/');

    for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) {
        issues.push({
          level: 'warn',
          code: 'placeholder-doc-content',
          message: `Placeholder content (${label}) in ${relative}`,
        });
        break;
      }
    }
  }

  return issues;
}
