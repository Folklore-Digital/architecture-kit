import { describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../src/config/schema.js';
import { buildNavBlocks } from '../src/site/navGroups.js';
import type { DocPage } from '../src/site/types.js';

function archPage(filename: string, title: string): DocPage {
  return {
    section: 'architecture',
    relativePath: `architecture/${filename}`,
    sourcePath: `/tmp/${filename}`,
    title,
    outputPath: filename.replace(/\.md$/i, '.html'),
  };
}

describe('buildNavBlocks', () => {
  it('orders start-here pages before alphabetical structure docs', () => {
    const config = createDefaultConfig('nextjs', 'Demo');
    const pages: DocPage[] = [
      archPage('environments.md', 'Environments'),
      archPage('ai-context.md', 'AI Context'),
      archPage('overview.md', 'Project Overview'),
      archPage('documentation-map.md', 'Documentation Map'),
      archPage('project-structure.md', 'Project Structure'),
    ];

    const blocks = buildNavBlocks(pages, config);
    const start = blocks.find((b) => b.id === 'start');
    expect(start?.pages.map((p) => p.outputPath)).toEqual([
      'overview.html',
      'documentation-map.html',
      'ai-context.html',
    ]);
  });

  it('sorts ADRs by numeric prefix', () => {
    const config = createDefaultConfig('nextjs', 'Demo');
    const pages: DocPage[] = [
      {
        section: 'adr',
        relativePath: 'adr/0003-later.md',
        sourcePath: '',
        title: 'Later',
        outputPath: 'adr/0003-later.html',
      },
      {
        section: 'adr',
        relativePath: 'adr/0001-first.md',
        sourcePath: '',
        title: 'First',
        outputPath: 'adr/0001-first.html',
      },
    ];

    const blocks = buildNavBlocks(pages, config);
    const adr = blocks.find((b) => b.id === 'adr');
    expect(adr?.pages.map((p) => p.title)).toEqual(['First', 'Later']);
  });
});
