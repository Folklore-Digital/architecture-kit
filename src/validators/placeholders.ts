import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { hasScaffoldFrontmatter } from '../utils/scaffoldFrontmatter.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

/** Patterns that indicate scaffold placeholder content, not finished docs. */
const PLACEHOLDER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b_TBD_\b/i, label: '_TBD_' },
  { pattern: /\b_Example\b/i, label: '_Example_' },
  { pattern: /Replace with/i, label: 'Replace with' },
  { pattern: /What problem are we solving\?/i, label: 'unfilled ADR context' },
  { pattern: /\| _[A-Za-z][^|_]*_ \|/i, label: 'placeholder table row' },
  { pattern: /Short project description/i, label: 'default config description' },
  { pattern: /Describe what this Next\.js application does/i, label: 'generic overview prompt' },
];

const CONFIG_PLACEHOLDER_DESCRIPTIONS = [
  'Short project description',
  'Describe what this',
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

function issueLevel(
  config: ArchitectureConfig,
  options?: { ci?: boolean },
): 'warn' | 'error' {
  if (config.governance.scaffoldBlocksCi && options?.ci) {
    return 'error';
  }
  return 'warn';
}

export async function validatePlaceholders(
  cwd: string,
  config: ArchitectureConfig,
  options?: { ci?: boolean },
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const level = issueLevel(config, options);
  const docsRoot = path.join(cwd, config.paths.docs);

  if (config.project.documentationStatus === 'scaffold') {
    issues.push({
      level,
      code: 'project-scaffold-mode',
      message:
        'project.documentationStatus is "scaffold" in architecture.config.json — customize docs and set to "active" when reviewed',
    });
  }

  if (!(await pathExists(docsRoot))) {
    return issues;
  }

  const files = await walkMarkdown(docsRoot);

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const relative = path.relative(cwd, filePath).replace(/\\/g, '/');

    if (hasScaffoldFrontmatter(content)) {
      issues.push({
        level,
        code: 'scaffold-doc-not-reviewed',
        message: `Scaffold template not reviewed (status: scaffold in frontmatter): ${relative}`,
      });
      continue;
    }

    for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) {
        issues.push({
          level,
          code: 'placeholder-doc-content',
          message: `Placeholder content (${label}) in ${relative}`,
        });
        break;
      }
    }
  }

  const configPath = path.join(cwd, 'architecture.config.json');
  if (await pathExists(configPath)) {
    const configRaw = await readFile(configPath, 'utf-8');
    if (
      CONFIG_PLACEHOLDER_DESCRIPTIONS.some((phrase) =>
        configRaw.includes(phrase),
      )
    ) {
      issues.push({
        level,
        code: 'placeholder-config-content',
        message:
          'architecture.config.json still has template placeholder values (description, stack, etc.)',
      });
    }
  }

  return issues;
}

export async function countScaffoldDocs(
  cwd: string,
  config: ArchitectureConfig,
): Promise<number> {
  const docsRoot = path.join(cwd, config.paths.docs);
  if (!(await pathExists(docsRoot))) {
    return 0;
  }
  const files = await walkMarkdown(docsRoot);
  let count = 0;
  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    if (hasScaffoldFrontmatter(content)) {
      count += 1;
    }
  }
  return count;
}
