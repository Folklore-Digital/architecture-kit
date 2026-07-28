import { describe, expect, it } from 'vitest';
import {
  hasScaffoldFrontmatter,
  stripFrontmatter,
  wrapScaffoldFrontmatter,
} from '../src/utils/scaffoldFrontmatter.js';
import { validateMermaid } from '../src/validators/mermaid.js';
import { validatePlaceholders } from '../src/validators/placeholders.js';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('scaffoldFrontmatter', () => {
  it('wraps markdown without existing frontmatter', () => {
    const wrapped = wrapScaffoldFrontmatter('# Title\n\nBody', '0.5.0');
    expect(wrapped).toContain('status: scaffold');
    expect(wrapped).toContain('scaffoldVersion: "0.5.0"');
    expect(hasScaffoldFrontmatter(wrapped)).toBe(true);
  });

  it('wraps mermaid diagrams with scaffold frontmatter', () => {
    const diagram = 'graph TD\n  App --> CMS';
    const wrapped = wrapScaffoldFrontmatter(diagram, '0.5.1');
    expect(hasScaffoldFrontmatter(wrapped)).toBe(true);
    expect(stripFrontmatter(wrapped)).toBe(diagram);
  });

  it('does not double-wrap frontmatter', () => {
    const existing = '---\nstatus: active\n---\n\n# Title';
    expect(wrapScaffoldFrontmatter(existing, '0.5.0')).toBe(existing);
  });

  it('strips frontmatter for rendering', () => {
    const raw = '---\nstatus: scaffold\n---\n\ngraph TD\n  A --> B';
    expect(stripFrontmatter(raw)).toBe('graph TD\n  A --> B');
  });
});

describe('scaffold validation', () => {
  it('warns on template diagram placeholders', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mmd-'));
    const diagrams = path.join(cwd, 'docs/diagrams');
    await mkdir(diagrams, { recursive: true });
    await writeFile(
      path.join(diagrams, 'system-context.mmd'),
      wrapScaffoldFrontmatter('graph TD\n  App --> CMS', '0.5.1'),
      'utf-8',
    );
    await writeFile(
      path.join(cwd, 'architecture.config.json'),
      JSON.stringify({
        project: { name: 'Test', type: 'nextjs' },
        governance: { scaffoldBlocksCi: true },
        paths: {
          docs: 'docs',
          architectureDocs: 'docs/architecture',
          adr: 'docs/adr',
          diagrams: 'docs/diagrams',
        },
      }),
      'utf-8',
    );

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );
    const mermaidIssues = await validateMermaid(cwd, config);
    expect(
      mermaidIssues.some((i) => i.code === 'scaffold-diagram-template'),
    ).toBe(true);

    const placeholderIssues = await validatePlaceholders(cwd, config);
    expect(
      placeholderIssues.some((i) => i.code === 'scaffold-doc-not-reviewed'),
    ).toBe(true);
  });

  it('warns when documentationStatus is active but scaffold files remain', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-active-'));
    const arch = path.join(cwd, 'docs/architecture');
    await mkdir(arch, { recursive: true });
    await writeFile(
      path.join(arch, 'overview.md'),
      wrapScaffoldFrontmatter('# Overview\n\nStill scaffold.', '0.5.1'),
      'utf-8',
    );
    await writeFile(
      path.join(cwd, 'architecture.config.json'),
      JSON.stringify({
        project: {
          name: 'Test',
          type: 'nextjs',
          documentationStatus: 'active',
        },
        paths: {
          docs: 'docs',
          architectureDocs: 'docs/architecture',
          adr: 'docs/adr',
          diagrams: 'docs/diagrams',
        },
      }),
      'utf-8',
    );

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );
    const issues = await validatePlaceholders(cwd, config);
    expect(issues.some((i) => i.code === 'active-with-scaffold-files')).toBe(
      true,
    );
  });
});
