import { access, readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runBuild } from '../src/commands/build.js';
import { runDetect } from '../src/commands/detect.js';
import { runInit } from '../src/commands/init.js';
import { detectProjectType } from '../src/detect/projectType.js';

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

describe('build site', () => {
  it('builds HTML from scaffolded nextjs docs', async () => {
    const cwd = await makeTempDir();
    await runInit({ type: 'nextjs', cwd });

    const outDir = path.join(cwd, 'site-out');
    const code = await runBuild({ cwd, out: 'site-out' });
    expect(code).toBe(0);

    const indexPath = path.join(outDir, 'index.html');
    await access(indexPath);
    const indexHtml = await readFile(indexPath, 'utf-8');
    expect(indexHtml).toContain('Architecture');
    expect(indexHtml).toContain('About this site');
    expect(indexHtml).toContain('Help · Architecture Kit');

    const helpPath = path.join(outDir, 'help.html');
    await access(helpPath);
    const helpHtml = await readFile(helpPath, 'utf-8');
    expect(helpHtml).toContain('npx architecture-kit validate');
    expect(helpHtml).toContain('paths.docs');
    expect(helpHtml).toContain('architecture.config.json');

    const searchIndexPath = path.join(outDir, 'search-index.json');
    await access(searchIndexPath);

    const overviewPath = path.join(outDir, 'overview.html');
    await access(overviewPath);
    const overviewHtml = await readFile(overviewPath, 'utf-8');
    expect(overviewHtml).toContain('Project Overview');
    expect(overviewHtml).not.toContain('architecture/architecture');

    const readmePath = path.join(outDir, 'README.html');
    await access(readmePath);
    const readmeHtml = await readFile(readmePath, 'utf-8');
    expect(readmeHtml).toContain('href="overview.html"');
    expect(readmeHtml).not.toContain('architecture/architecture');
    expect(readmeHtml).not.toContain('href="architecture/overview.html"');
  });
});

describe('detect project type', () => {
  it('suggests nextjs when package.json depends on next', async () => {
    const cwd = await makeTempDir();
    await runInit({ type: 'generic', cwd });

    const pkg = {
      name: 'demo-next-app',
      dependencies: { next: '16.0.0', react: '19.0.0' },
    };
    const fs = await import('node:fs/promises');
    await fs.writeFile(
      path.join(cwd, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`,
      'utf-8',
    );

    const detection = await detectProjectType(cwd);
    expect(detection.suggested).toBe('nextjs');
    expect(detection.confidence).toBe('high');
  });

  it('detect command reports config match', async () => {
    const cwd = await makeTempDir();
    await runInit({ type: 'nextjs', cwd });

    const pkg = {
      name: 'demo',
      dependencies: { next: '16.0.0' },
    };
    const fs = await import('node:fs/promises');
    await fs.writeFile(
      path.join(cwd, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`,
      'utf-8',
    );

    const code = await runDetect({ cwd });
    expect(code).toBe(0);
  });
});
