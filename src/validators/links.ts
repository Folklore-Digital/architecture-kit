import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const SKIP_SCHEMES = /^(https?:|mailto:|tel:|#)/i;

function stripFrontmatter(content: string): string {
  if (content.startsWith('---\n')) {
    const end = content.indexOf('\n---\n', 4);
    if (end !== -1) {
      return content.slice(end + 5);
    }
  }
  return content;
}

async function walkMarkdownFiles(
  dir: string,
  files: string[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(fullPath, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
}

function resolveDocLink(
  linkTarget: string,
  fromFile: string,
  docsRoot: string,
): string {
  const withoutHash = linkTarget.split('#')[0] ?? '';
  if (!withoutHash) {
    return fromFile;
  }
  if (path.isAbsolute(withoutHash)) {
    return withoutHash;
  }
  return path.normalize(path.join(path.dirname(fromFile), withoutHash));
}

async function targetExists(resolved: string): Promise<boolean> {
  if (await pathExists(resolved)) {
    return true;
  }
  const candidates = [
    resolved,
    `${resolved}.md`,
    `${resolved}.mmd`,
    path.join(resolved, 'index.md'),
  ];
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return true;
    }
  }
  return false;
}

export async function validateLinks(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const docsRoot = path.join(cwd, config.paths.docs);

  if (!(await pathExists(docsRoot))) {
    return issues;
  }

  const mdFiles: string[] = [];
  await walkMarkdownFiles(docsRoot, mdFiles);

  for (const filePath of mdFiles) {
    const content = await readFile(filePath, 'utf-8');
    const body = stripFrontmatter(content);
    const relFile = path.relative(cwd, filePath).replace(/\\/g, '/');

    for (const match of body.matchAll(MARKDOWN_LINK)) {
      const rawTarget = match[2]?.trim() ?? '';
      if (!rawTarget || SKIP_SCHEMES.test(rawTarget)) {
        continue;
      }

      const resolved = resolveDocLink(rawTarget, filePath, docsRoot);
      const exists = await targetExists(resolved);

      if (!exists) {
        issues.push({
          level: 'error',
          code: 'broken-doc-link',
          message: `Broken link in ${relFile}: "${rawTarget}" does not resolve to an existing file`,
        });
      }
    }
  }

  return issues;
}
