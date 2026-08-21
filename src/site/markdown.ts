import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { stripFrontmatter } from '../utils/scaffoldFrontmatter.js';
import type { DocPage } from './types.js';
import { navHref, resolveDocLink } from './paths.js';

marked.setOptions({
  gfm: true,
  breaks: false,
});

function escapeMermaidHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

marked.use({
  renderer: {
    code({ text, lang }) {
      if (lang?.trim().toLowerCase() === 'mermaid') {
        return `<pre class="mermaid">${escapeMermaidHtml(text)}</pre>`;
      }
      return false;
    },
  },
});

/** True when markdown body contains a fenced ```mermaid block (after frontmatter). */
export function markdownContainsMermaid(raw: string): boolean {
  const body = stripFrontmatter(raw);
  return /```\s*mermaid\b/i.test(body);
}

function docPathToHtmlPath(file: string): string {
  return file.replace(/\.(md|mmd)$/i, '.html');
}

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
    /href="([^"]+\.(?:md|mmd))(#[^"]*)?"/gi,
    (match, file: string, hash = '') => {
      const resolved = resolveDocLink(page.relativePath, `${file}${hash}`);
      if (!resolved) {
        return `href="${docPathToHtmlPath(file)}${hash}"`;
      }

      const targetOutput = outputs.get(resolved.docPath);
      if (!targetOutput) {
        return `href="${docPathToHtmlPath(file)}${resolved.hash}"`;
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
  const parsed = await marked.parse(stripFrontmatter(raw));
  const body = rewriteInternalLinks(parsed, page, pages);
  return body;
}

export async function pageNeedsMermaid(page: DocPage): Promise<boolean> {
  if (page.relativePath.endsWith('.mmd')) {
    return true;
  }
  if (!page.relativePath.endsWith('.md')) {
    return false;
  }
  const raw = await readFile(page.sourcePath, 'utf-8');
  return markdownContainsMermaid(raw);
}

export async function renderMermaidPage(page: DocPage): Promise<string> {
  const raw = await readFile(page.sourcePath, 'utf-8');
  const source = stripFrontmatter(raw);
  const escaped = escapeMermaidHtml(source);

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
