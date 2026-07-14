import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { projectTypeLabels } from '../config/schema.js';
import { collectPages } from './collectPages.js';
import { renderHomePage, renderPageShell } from './layout.js';
import { renderMarkdownPage, renderMermaidPage } from './markdown.js';
import type { BuildSiteResult } from './types.js';

export const DEFAULT_SITE_DIR = '.architecture-kit/site';

export async function buildSite(
  cwd: string,
  config: ArchitectureConfig,
  outDir = path.join(cwd, DEFAULT_SITE_DIR),
): Promise<BuildSiteResult> {
  const pages = await collectPages(cwd, config);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const page of pages) {
    const isMermaid = page.relativePath.endsWith('.mmd');
    const bodyHtml = isMermaid
      ? await renderMermaidPage(page)
      : `<article>${await renderMarkdownPage(page)}</article>`;

    const html = renderPageShell({
      projectName: config.project.name,
      page,
      bodyHtml,
      pages,
      includeMermaid: isMermaid,
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
  });
  await writeFile(path.join(outDir, 'index.html'), homeHtml, 'utf-8');

  return { outDir, pages };
}
