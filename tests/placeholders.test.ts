import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { createDefaultConfig } from '../src/config/schema.js';
import { validatePlaceholders } from '../src/validators/placeholders.js';

const tempDirs: string[] = [];

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe('validatePlaceholders', () => {
  it('warns on scaffold placeholder text', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-'));
    tempDirs.push(cwd);
    const config = createDefaultConfig('generic', 'Test');
    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '# Overview\n\nReplace with real content.\n',
      'utf-8',
    );

    const issues = await validatePlaceholders(cwd, config);
    expect(issues.some((i) => i.code === 'placeholder-doc-content')).toBe(true);
  });

  it('warns on scaffold frontmatter', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-'));
    tempDirs.push(cwd);
    const config = createDefaultConfig('generic', 'Test');
    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '---\nstatus: scaffold\n---\n\n# Overview\n\nReal content.\n',
      'utf-8',
    );

    const issues = await validatePlaceholders(cwd, config);
    expect(issues.some((i) => i.code === 'scaffold-doc-not-reviewed')).toBe(true);
  });

  it('treats scaffold as CI error when configured', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-'));
    tempDirs.push(cwd);
    const config = createDefaultConfig('generic', 'Test');
    config.project.documentationStatus = 'scaffold';
    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '# Overview\n\nProduction-ready content.\n',
      'utf-8',
    );

    const issues = await validatePlaceholders(cwd, config, { ci: true });
    expect(issues.some((i) => i.code === 'project-scaffold-mode')).toBe(true);
    expect(issues.every((i) => i.level === 'error')).toBe(true);
  });

  it('passes clean documentation', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-'));
    tempDirs.push(cwd);
    const config = createDefaultConfig('generic', 'Test');
    config.project.documentationStatus = 'active';
    config.project.description = 'Real project description';
    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '# Overview\n\nProduction-ready content.\n',
      'utf-8',
    );

    const issues = await validatePlaceholders(cwd, config);
    expect(issues).toHaveLength(0);
  });
});
