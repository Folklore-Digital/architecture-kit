import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

export async function validateStorybook(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const storybook = config.storybook;
  if (!storybook?.enabled) {
    return [];
  }

  const issues: ValidationIssue[] = [];

  if (!storybook.url) {
    issues.push({
      level: 'warn',
      code: 'storybook-missing-url',
      message:
        'storybook.enabled is true but storybook.url is not set in architecture.config.json',
    });
  }

  if (storybook.docsPath) {
    const docsPath = path.join(cwd, storybook.docsPath);
    if (!(await pathExists(docsPath))) {
      issues.push({
        level: 'warn',
        code: 'storybook-docs-missing',
        message: `storybook.docsPath not found: ${storybook.docsPath}`,
      });
    }
  }

  const docMapPath = path.join(
    cwd,
    config.paths.architectureDocs,
    'documentation-map.md',
  );
  if (await pathExists(docMapPath)) {
    const content = await readFile(docMapPath, 'utf-8');
    if (!/storybook/i.test(content)) {
      issues.push({
        level: 'warn',
        code: 'storybook-not-in-doc-map',
        message:
          'Storybook is enabled but documentation-map.md does not mention Storybook (link UI docs from system architecture)',
      });
    }
  }

  return issues;
}
