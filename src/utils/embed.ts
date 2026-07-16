import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathExists, readText } from './fileSystem.js';

export type EmbedTarget = 'nextjs';

export function getEmbedDir(packageRoot: string, target: EmbedTarget): string {
  return path.join(packageRoot, 'templates/embed', target);
}

export async function nextConfigNeedsEmbedReminder(cwd: string): Promise<boolean> {
  for (const file of ['next.config.ts', 'next.config.mjs', 'next.config.js']) {
    const configPath = path.join(cwd, file);
    if (!(await pathExists(configPath))) {
      continue;
    }
    const content = await readText(configPath);
    if (
      content.includes('ARCHITECTURE_DOCS_PATH') ||
      content.includes('/architecture/')
    ) {
      return false;
    }
  }
  return true;
}

export async function readKitVersionRange(
  packageRoot: string,
): Promise<string> {
  const pkg = JSON.parse(
    await readFile(path.join(packageRoot, 'package.json'), 'utf-8'),
  ) as { version?: string };
  const version = pkg.version ?? '0.0.0';
  const [major, minor] = version.split('.');
  return `^${major}.${minor}.0`;
}
