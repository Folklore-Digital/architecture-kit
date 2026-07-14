import type { DocPage, DocSection } from './types.js';

const MERMAID_SCRIPT =
  'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

const SECTION_LABELS: Record<DocSection, string> = {
  architecture: 'Architecture',
  adr: 'ADRs',
  diagram: 'Diagrams',
  other: 'Docs',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function depthToRoot(outputPath: string): string {
  const depth = outputPath.split('/').length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function navHref(fromOutputPath: string, targetOutputPath: string): string {
  const fromDir = fromOutputPath.includes('/')
    ? fromOutputPath.slice(0, fromOutputPath.lastIndexOf('/') + 1)
    : '';
  const fromParts = fromDir ? fromDir.split('/').filter(Boolean) : [];
  const targetParts = targetOutputPath.split('/');
  const targetFile = targetParts.pop() ?? 'index.html';
  const targetDirParts = targetParts;

  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < targetDirParts.length &&
    fromParts[shared] === targetDirParts[shared]
  ) {
    shared += 1;
  }

  const up = fromParts.length - shared;
  const prefix = up === 0 ? '' : '../'.repeat(up);
  const down = targetDirParts.slice(shared).join('/');
  const suffix = down ? `${down}/${targetFile}` : targetFile;
  return `${prefix}${suffix}`;
}

function renderNav(pages: DocPage[], current: DocPage): string {
  const sections: DocSection[] = ['architecture', 'adr', 'diagram', 'other'];
  const blocks: string[] = [];

  for (const section of sections) {
    const sectionPages = pages.filter((page) => page.section === section);
    if (sectionPages.length === 0) {
      continue;
    }

    const links = sectionPages
      .map((page) => {
        const href = navHref(current.outputPath, page.outputPath);
        const active =
          page.outputPath === current.outputPath ? ' class="active"' : '';
        return `<li><a href="${href}"${active}>${escapeHtml(page.title)}</a></li>`;
      })
      .join('\n');

    blocks.push(
      `<section class="nav-group"><h2>${SECTION_LABELS[section]}</h2><ul>${links}</ul></section>`,
    );
  }

  return blocks.join('\n');
}

export function renderPageShell(options: {
  projectName: string;
  page: DocPage;
  bodyHtml: string;
  pages: DocPage[];
  includeMermaid: boolean;
}): string {
  const { projectName, page, bodyHtml, pages, includeMermaid } = options;
  const root = depthToRoot(page.outputPath);
  const homeHref = root ? `${root}index.html` : 'index.html';
  const nav = renderNav(pages, page);
  const sourceLink =
    page.sourcePath && page.relativePath.endsWith('.md')
      ? `<p class="source-link"><a href="${navHref(page.outputPath, page.outputPath.replace(/\.html$/i, '.md'))}">View Markdown source</a></p>`
      : page.sourcePath && page.relativePath.endsWith('.mmd')
        ? `<p class="source-link"><a href="${navHref(page.outputPath, page.outputPath.replace(/\.html$/i, '.mmd'))}">View Mermaid source</a></p>`
        : '';
  const mermaidInit = includeMermaid
    ? `<script src="${MERMAID_SCRIPT}"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: 'neutral' });</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(page.title)} · ${escapeHtml(projectName)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0f1419;
      --panel: #1a2332;
      --text: #e7ecf3;
      --muted: #9aa7b8;
      --accent: #5b9fd4;
      --border: #2a3648;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f6f8fb;
        --panel: #ffffff;
        --text: #1a2332;
        --muted: #5a6b7d;
        --accent: #1d6fb8;
        --border: #d8e0ea;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
    }
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }
    aside {
      background: var(--panel);
      border-right: 1px solid var(--border);
      padding: 1.25rem;
      overflow-y: auto;
    }
    aside h1 {
      font-size: 1rem;
      margin: 0 0 1rem;
    }
    aside h1 a { color: inherit; text-decoration: none; }
    .nav-group h2 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 1rem 0 0.35rem;
    }
    .nav-group ul { list-style: none; padding: 0; margin: 0; }
    .nav-group a {
      display: block;
      padding: 0.3rem 0;
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .nav-group a.active { color: var(--accent); font-weight: 600; }
    main {
      padding: 2rem 2.5rem;
      max-width: 52rem;
    }
    main h1 { margin-top: 0; }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.9em;
    }
    pre {
      background: var(--panel);
      border: 1px solid var(--border);
      padding: 1rem;
      overflow-x: auto;
      border-radius: 6px;
    }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
    a { color: var(--accent); }
    .mermaid { background: transparent; }
    .source-link { margin-top: 2rem; font-size: 0.85rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="layout">
    <aside>
      <h1><a href="${homeHref}">${escapeHtml(projectName)}</a></h1>
      ${nav}
    </aside>
    <main>
      ${bodyHtml}
      ${sourceLink}
    </main>
  </div>
  ${mermaidInit}
</body>
</html>`;
}

export function renderHomePage(options: {
  projectName: string;
  projectTypeLabel: string;
  pages: DocPage[];
}): string {
  const { projectName, projectTypeLabel, pages } = options;
  const overview = pages.find((page) =>
    page.relativePath.endsWith('architecture/overview.md'),
  );
  const overviewLink = overview
    ? navHref('index.html', overview.outputPath)
    : pages[0]
      ? navHref('index.html', pages[0].outputPath)
      : '#';

  const body = `<h1>${escapeHtml(projectName)}</h1>
<p>Architecture documentation (${escapeHtml(projectTypeLabel)}).</p>
<p><a href="${overviewLink}">Open project overview →</a></p>
<p class="muted">Generated by <strong>@folklore/architecture-kit</strong></p>`;

  const fakePage: DocPage = {
    section: 'other',
    relativePath: 'index',
    sourcePath: '',
    title: 'Home',
    outputPath: 'index.html',
  };

  return renderPageShell({
    projectName,
    page: fakePage,
    bodyHtml: body,
    pages,
    includeMermaid: false,
  });
}
