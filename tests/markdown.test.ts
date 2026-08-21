import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectPages } from '../src/site/collectPages.js';
import {
  markdownContainsMermaid,
  renderMarkdownPage,
  pageNeedsMermaid,
} from '../src/site/markdown.js';
import type { ArchitectureConfig } from '../src/config/schema.js';
import { createDefaultConfig } from '../src/config/schema.js';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-md-'));
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

describe('markdownContainsMermaid', () => {
  it('detects fenced mermaid blocks', () => {
    expect(
      markdownContainsMermaid('```mermaid\nflowchart LR\n  a-->b\n```'),
    ).toBe(true);
  });

  it('ignores other code fences', () => {
    expect(markdownContainsMermaid('```bash\necho hi\n```')).toBe(false);
  });
});

describe('renderMarkdownPage', () => {
  it('renders inline mermaid as pre.mermaid', async () => {
    const cwd = await makeTempDir();
    const config: ArchitectureConfig = {
      ...createDefaultConfig('generic', 'Test'),
      paths: {
        ...createDefaultConfig('generic').paths,
        architectureDocs: 'docs/handbook',
      },
    };

    await mkdir(path.join(cwd, 'docs/handbook'), { recursive: true });
    await mkdir(path.join(cwd, 'docs/diagrams'), { recursive: true });

    await writeFile(
      path.join(cwd, 'docs/handbook/page.md'),
      '# Page\n\n```mermaid\nflowchart LR\n  a-->b\n```\n',
      'utf-8',
    );
    await writeFile(
      path.join(cwd, 'docs/diagrams/flow.mmd'),
      'flowchart LR\n  x-->y',
      'utf-8',
    );

    const pages = await collectPages(cwd, config);
    const page = pages.find((p) => p.relativePath === 'handbook/page.md');
    expect(page).toBeDefined();

    const html = await renderMarkdownPage(page!, pages);
    expect(html).toContain('<pre class="mermaid">');
    expect(html).toContain('flowchart LR');
    expect(html).not.toContain('language-mermaid');
  });

  it('rewrites mmd links to html paths', async () => {
    const cwd = await makeTempDir();
    const config: ArchitectureConfig = {
      ...createDefaultConfig('generic', 'Test'),
      paths: {
        ...createDefaultConfig('generic').paths,
        architectureDocs: 'docs/handbook',
      },
    };

    await mkdir(path.join(cwd, 'docs/handbook'), { recursive: true });
    await mkdir(path.join(cwd, 'docs/diagrams'), { recursive: true });

    await writeFile(
      path.join(cwd, 'docs/handbook/page.md'),
      '# Page\n\n[Diagram](../diagrams/flow.mmd)\n',
      'utf-8',
    );
    await writeFile(
      path.join(cwd, 'docs/diagrams/flow.mmd'),
      'flowchart LR\n  x-->y',
      'utf-8',
    );

    const pages = await collectPages(cwd, config);
    const page = pages.find((p) => p.relativePath === 'handbook/page.md');
    const html = await renderMarkdownPage(page!, pages);
    expect(html).toContain('href="diagrams/flow.html"');
    expect(html).not.toContain('flow.mmd');
  });

  it('pageNeedsMermaid is true for inline mermaid markdown', async () => {
    const cwd = await makeTempDir();
    const config = createDefaultConfig('generic', 'Test');
    await mkdir(path.join(cwd, 'docs/architecture'), { recursive: true });
    await writeFile(
      path.join(cwd, 'docs/architecture/overview.md'),
      '```mermaid\nflowchart LR\n  a-->b\n```',
      'utf-8',
    );

    const pages = await collectPages(cwd, config);
    const page = pages.find((p) => p.relativePath.endsWith('overview.md'));
    expect(await pageNeedsMermaid(page!)).toBe(true);
  });
});
