import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArchitectureConfig } from '../config/schema.js';
import { projectTypeLabels } from '../config/schema.js';
import { collectPages } from './collectPages.js';
import { renderHelpPage, renderHomePage, renderPageShell } from './layout.js';
import { KIT_HELP_OUTPUT, kitHelpSearchText } from './kitHelp.js';
import { renderMarkdownPage, renderMermaidPage } from './markdown.js';
import { buildSearchIndex } from './search.js';
import type { BuildSiteResult } from './types.js';

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

async function readKitVersion(): Promise<string> {
  try {
    const raw = await readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export const DEFAULT_SITE_DIR = '.architecture-kit/site';

export async function buildSite(
  cwd: string,
  config: ArchitectureConfig,
  outDir = path.join(cwd, DEFAULT_SITE_DIR),
): Promise<BuildSiteResult> {
  const pages = await collectPages(cwd, config);
  const kitVersion = await readKitVersion();

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const page of pages) {
    const isMermaid = page.relativePath.endsWith('.mmd');
    const bodyHtml = isMermaid
      ? await renderMermaidPage(page)
      : `<article>${await renderMarkdownPage(page, pages)}</article>`;

    const html = renderPageShell({
      projectName: config.project.name,
      page,
      bodyHtml,
      pages,
      includeMermaid: isMermaid,
      config,
    });

    const target = path.join(outDir, page.outputPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, 'utf-8');

    const sourceOut = page.outputPath.replace(/\.html$/i, '.md');
    if (page.relativePath.endsWith('.md')) {
      await cp(page.sourcePath, path.join(outDir, sourceOut));
    } else if (page.relativePath.endsWith('.mmd')) {
      await cp(
        page.sourcePath,
        path.join(outDir, page.outputPath.replace(/\.html$/i, '.mmd')),
      );
    }
  }

  const homeHtml = renderHomePage({
    projectName: config.project.name,
    projectTypeLabel: projectTypeLabels[config.project.type],
    pages,
    config,
    kitVersion,
  });
  await writeFile(path.join(outDir, 'index.html'), homeHtml, 'utf-8');

  const helpHtml = renderHelpPage({
    projectName: config.project.name,
    pages,
    config,
    kitVersion,
  });
  await writeFile(path.join(outDir, KIT_HELP_OUTPUT), helpHtml, 'utf-8');

  const searchIndex = [
    ...buildSearchIndex(pages),
    {
      title: 'Help — Architecture Kit',
      path: KIT_HELP_OUTPUT,
      section: 'other' as const,
      excerpt: kitHelpSearchText().slice(0, 160),
    },
  ];
  await writeFile(
    path.join(outDir, 'search-index.json'),
    `${JSON.stringify(searchIndex, null, 2)}\n`,
    'utf-8',
  );

  return { outDir, pages };
}
