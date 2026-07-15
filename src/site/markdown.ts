import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import type { DocPage } from './types.js';

marked.setOptions({
  gfm: true,
  breaks: false,
});

function rewriteInternalLinks(html: string): string {
  return html.replace(
    /href="([^"]+\.md)(#[^"]*)?"/gi,
    (_match, file: string, hash = '') => {
      const htmlFile = file.replace(/\.md$/i, '.html');
      return `href="${htmlFile}${hash}"`;
    },
  );
}

export async function renderMarkdownPage(page: DocPage): Promise<string> {
  const raw = await readFile(page.sourcePath, 'utf-8');
  const body = rewriteInternalLinks(await marked.parse(raw));
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
