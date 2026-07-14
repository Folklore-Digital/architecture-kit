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

  return `<pre class="mermaid">${escaped}</pre>`;
}
