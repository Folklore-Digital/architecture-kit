import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runInit } from '../src/commands/init.js';
import { runScan } from '../src/commands/bootstrap.js';
import { createDefaultConfig } from '../src/config/schema.js';
import { validateLinks } from '../src/validators/links.js';
import { validateMermaid } from '../src/validators/mermaid.js';
import { validateStorybook } from '../src/validators/storybook.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe('validateLinks', () => {
  it('flags broken relative markdown links', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '# Overview\n\nSee [missing](./does-not-exist.md).\n',
      'utf-8',
    );

    const issues = await validateLinks(cwd, config);
    expect(issues.some((i) => i.code === 'broken-doc-link')).toBe(true);
  });

  it('ignores external links', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '# Overview\n\n[GitHub](https://github.com)\n',
      'utf-8',
    );

    const issues = await validateLinks(cwd, config);
    expect(issues).toHaveLength(0);
  });
});

describe('validateMermaid', () => {
  it('flags unbalanced brackets in diagrams', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    await mkdir(path.join(cwd, 'docs/diagrams'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/diagrams/broken.mmd'),
      'flowchart LR\n  A[Start --> B\n',
      'utf-8',
    );

    const issues = await validateMermaid(cwd, config);
    expect(issues.some((i) => i.code === 'mermaid-unbalanced-brackets')).toBe(
      true,
    );
  });
});

describe('validateStorybook', () => {
  it('skips validation when storybook is not enabled', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    const issues = await validateStorybook(cwd, config);
    expect(issues).toHaveLength(0);
  });

  it('warns when enabled but documentation-map omits Storybook', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');
    config.storybook = { enabled: true, url: 'http://localhost:6006' };

    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/documentation-map.md'),
      '# Map\n\nNo UI docs here.\n',
      'utf-8',
    );

    const issues = await validateStorybook(cwd, config);
    expect(issues.some((i) => i.code === 'storybook-not-in-doc-map')).toBe(true);
  });
});

describe('scan command', () => {
  it('writes agent context for scaffolded project', async () => {
    const cwd = await makeTempDir();
    await runInit({ type: 'nextjs', cwd });

    const code = await runScan({ cwd });
    expect(code).toBe(0);

    const contextPath = path.join(cwd, '.architecture-kit/agent-context.md');
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(contextPath, 'utf-8'),
    );
    expect(content).toContain('Architecture bootstrap context');
    expect(content).toContain('AI agent task checklist');
  });
});
