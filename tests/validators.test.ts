import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../src/config/schema.js';
import { validateAiTooling } from '../src/validators/aiTooling.js';
import { validateDiffAwareness } from '../src/validators/diffAwareness.js';

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

describe('validateAiTooling', () => {
  it('warns when cursor rule and agent docs are missing', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    const issues = await validateAiTooling(cwd, config);
    const codes = issues.map((issue) => issue.code);

    expect(codes).toContain('missing-cursor-rule');
    expect(codes).toContain('missing-agents-md');
  });

  it('does not require AGENTS.md when cursor rule is present', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    await mkdir(path.join(cwd, '.cursor/rules'), { recursive: true });
    await writeFile(
      path.join(cwd, '.cursor/rules/architecture-kit.mdc'),
      '# Architecture Kit\n',
      'utf-8',
    );

    const issues = await validateAiTooling(cwd, config);
    expect(issues).toHaveLength(0);
  });

  it('passes when cursor rule and AGENTS.md reference architecture-kit', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    await mkdir(path.join(cwd, '.cursor/rules'), { recursive: true });
    await writeFile(
      path.join(cwd, '.cursor/rules/architecture-kit.mdc'),
      '# Architecture Kit\n',
      'utf-8',
    );
    await writeFile(
      path.join(cwd, 'AGENTS.md'),
      'Use architecture-kit and docs/architecture/ai-context.md\n',
      'utf-8',
    );

    const issues = await validateAiTooling(cwd, config);
    expect(issues).toHaveLength(0);
  });
});

describe('validateDiffAwareness', () => {
  it('returns no issues when since ref cannot be resolved', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('nextjs', 'Demo');

    const issues = await validateDiffAwareness(
      cwd,
      config,
      'origin/nonexistent-branch',
    );
    expect(issues).toHaveLength(0);
  });
});
