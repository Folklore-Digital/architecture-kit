import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor } from '../src/commands/doctor.js';
import { runInit } from '../src/commands/init.js';
import { runValidate } from '../src/commands/validate.js';
import { integrationMentioned } from '../src/utils/fileSystem.js';

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

describe('integrationMentioned', () => {
  it('detects integration names case-insensitively', () => {
    const markdown = '| Contentful | CMS | Yes |';
    expect(integrationMentioned(markdown, 'contentful')).toBe(true);
    expect(integrationMentioned(markdown, 'Google Tag Manager')).toBe(false);
  });
});

describe('init + validate + doctor', () => {
  it('scaffolds generic docs and passes base validation', async () => {
    const cwd = await makeTempDir();

    await runInit({ type: 'generic', name: 'Demo Project', cwd });

    const configRaw = await readFile(
      path.join(cwd, 'architecture.config.json'),
      'utf-8',
    );
    const config = JSON.parse(configRaw) as {
      project: { name: string; type: string };
    };
    expect(config.project.name).toBe('Demo Project');
    expect(config.project.type).toBe('generic');

    const agentsMd = await readFile(path.join(cwd, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toContain('architecture-kit');

    await expect(
      readFile(path.join(cwd, 'CLAUDE.md'), 'utf-8'),
    ).rejects.toThrow();
    await expect(
      readFile(path.join(cwd, '.cursor/rules/architecture-kit.mdc'), 'utf-8'),
    ).rejects.toThrow();

    const validateCode = await runValidate({ cwd, level: 'error' });
    expect(validateCode).toBe(0);

    const doctorCode = await runDoctor(cwd);
    expect(doctorCode).toBe(0);
  });

  it('scaffolds cursor and claude adapters when requested', async () => {
    const cwd = await makeTempDir();

    await runInit({
      type: 'generic',
      name: 'Adapter Demo',
      cwd,
      adapters: ['agents', 'cursor', 'claude'],
    });

    const cursorRule = await readFile(
      path.join(cwd, '.cursor/rules/architecture-kit.mdc'),
      'utf-8',
    );
    expect(cursorRule).toContain('Architecture Kit');

    const claudeMd = await readFile(path.join(cwd, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('architecture-kit');

    const claudeSkill = await readFile(
      path.join(cwd, '.claude/skills/architecture-kit/SKILL.md'),
      'utf-8',
    );
    expect(claudeSkill).toContain('Reading order');

    const configRaw = await readFile(
      path.join(cwd, 'architecture.config.json'),
      'utf-8',
    );
    const config = JSON.parse(configRaw) as {
      ai?: { adapters?: string[] };
    };
    expect(config.ai?.adapters).toEqual(['agents', 'cursor', 'claude']);
  });

  it('scaffolds nextjs template files', async () => {
    const cwd = await makeTempDir();

    await runInit({ type: 'nextjs', cwd });

    const renderingModel = await readFile(
      path.join(cwd, 'docs/architecture/rendering-model.md'),
      'utf-8',
    );
    expect(renderingModel).toContain('Rendering Model');
  });

  it('does not overwrite existing docs on re-init', async () => {
    const cwd = await makeTempDir();

    await runInit({ type: 'nextjs', cwd, name: 'First' });

    const overviewPath = path.join(cwd, 'docs/architecture/overview.md');
    await writeFile(overviewPath, '# Custom Overview\n\nKEEP_THIS_MARKER\n', 'utf-8');

    await runInit({ type: 'nextjs', cwd, name: 'Second' });

    const overview = await readFile(overviewPath, 'utf-8');
    expect(overview).toContain('KEEP_THIS_MARKER');

    const configRaw = await readFile(
      path.join(cwd, 'architecture.config.json'),
      'utf-8',
    );
    const config = JSON.parse(configRaw) as { project: { name: string } };
    expect(config.project.name).toBe('First');
  });

  it('scaffolds nextjs embed scripts and merges package.json', async () => {
    const cwd = await makeTempDir();

    await writeFile(
      path.join(cwd, 'package.json'),
      `${JSON.stringify(
        {
          name: 'demo-next-app',
          private: true,
          scripts: { dev: 'next dev', build: 'next build' },
          devDependencies: { next: '16.0.0' },
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );

    await runInit({ type: 'nextjs', cwd, embed: 'nextjs' });

    await readFile(
      path.join(cwd, 'scripts/build-architecture-site.mjs'),
      'utf-8',
    );
    await readFile(path.join(cwd, 'scripts/lib/resolve-kit.mjs'), 'utf-8');

    const pkg = JSON.parse(
      await readFile(path.join(cwd, 'package.json'), 'utf-8'),
    ) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(pkg.scripts['architecture:site:build']).toContain(
      'build-architecture-site.mjs',
    );
    expect(pkg.scripts['predev']).toBe('node scripts/build-architecture-site.mjs');
    expect(pkg.devDependencies['@folklore-digital/architecture-kit']).toMatch(
      /^\^1\.\d+\.\d+$/,
    );
    expect(pkg.scripts.dev).toBe('next dev');

    const gitignore = await readFile(path.join(cwd, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('/public/architecture/');
    expect(gitignore).toContain('/.architecture-kit/');

    await readFile(
      path.join(cwd, 'middleware.architecture-docs.example.ts'),
      'utf-8',
    );
    await readFile(
      path.join(cwd, 'docs/architecture/deploy-safety/README.md'),
      'utf-8',
    );
  });
});
