import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import type { DocPage } from './types.js';
import { navHref, resolveDocLink } from './paths.js';

marked.setOptions({
  gfm: true,
  breaks: false,
});

function outputPathByDocPath(pages: DocPage[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const page of pages) {
    map.set(page.relativePath.replace(/\\/g, '/'), page.outputPath);
  }
  return map;
}

function rewriteInternalLinks(
  html: string,
  page: DocPage,
  pages: DocPage[],
): string {
  const outputs = outputPathByDocPath(pages);

  return html.replace(
    /href="([^"]+\.md)(#[^"]*)?"/gi,
    (match, file: string, hash = '') => {
      const resolved = resolveDocLink(page.relativePath, `${file}${hash}`);
      if (!resolved) {
        const htmlFile = file.replace(/\.md$/i, '.html');
        return `href="${htmlFile}${hash}"`;
      }

      const targetOutput = outputs.get(resolved.docPath);
      if (!targetOutput) {
        const htmlFile = file.replace(/\.md$/i, '.html');
        return `href="${htmlFile}${resolved.hash}"`;
      }

      return `href="${navHref(page.outputPath, targetOutput)}${resolved.hash}"`;
    },
  );
}

export async function renderMarkdownPage(
  page: DocPage,
  pages: DocPage[],
): Promise<string> {
  const raw = await readFile(page.sourcePath, 'utf-8');
  const parsed = await marked.parse(raw);
  const body = rewriteInternalLinks(parsed, page, pages);
  return body;
}

export async function renderMermaidPage(page: DocPage): Promise<string> {
  const source = await readFile(page.sourcePath, 'utf-8');
  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<div class="diagram-viewer" data-diagram-viewer>
  <div class="diagram-toolbar" role="toolbar" aria-label="Diagram zoom controls">
    <button type="button" data-zoom-out aria-label="Zoom out">−</button>
    <span class="diagram-zoom-level" data-zoom-level>100%</span>
    <button type="button" data-zoom-in aria-label="Zoom in">+</button>
    <button type="button" data-zoom-reset>Reset</button>
    <button type="button" data-zoom-fit>Fit width</button>
  </div>
  <div class="diagram-stage">
    <pre class="mermaid">${escaped}</pre>
  </div>
</div>`;
}
