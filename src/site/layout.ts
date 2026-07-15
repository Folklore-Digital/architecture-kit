import type { DocPage, DocSection } from './types.js';
import { MERMAID_SETUP_SCRIPTS } from './mermaidInitScript.js';
import { navHref } from './paths.js';

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

function renderNav(pages: DocPage[], current: DocPage): string {
  const sections: DocSection[] = ['architecture', 'adr', 'diagram', 'other'];
  const blocks: string[] = [];

  for (const section of sections) {
    const sectionPages = pages.filter((page) => page.section === section);
    if (sectionPages.length === 0) {
      continue;
    }

    const isOpen =
      sectionPages.some((page) => page.outputPath === current.outputPath) ||
      (current.outputPath === 'index.html' && section === 'architecture');
    const openAttr = isOpen ? ' open' : '';

    const links = sectionPages
      .map((page) => {
        const href = navHref(current.outputPath, page.outputPath);
        const active =
          page.outputPath === current.outputPath ? ' class="active"' : '';
        return `<li><a href="${href}"${active}>${escapeHtml(page.title)}</a></li>`;
      })
      .join('\n');

    blocks.push(
      `<details class="nav-accordion"${openAttr}><summary>${SECTION_LABELS[section]}</summary><ul>${links}</ul></details>`,
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
  const mainClass = page.section === 'diagram' ? ' class="main--diagram"' : '';
  const sourceLink =
    page.sourcePath && page.relativePath.endsWith('.md')
      ? `<p class="source-link"><a href="${navHref(page.outputPath, page.outputPath.replace(/\.html$/i, '.md'))}">View Markdown source</a></p>`
      : page.sourcePath && page.relativePath.endsWith('.mmd')
        ? `<p class="source-link"><a href="${navHref(page.outputPath, page.outputPath.replace(/\.html$/i, '.mmd'))}">View Mermaid source</a></p>`
        : '';
  const mermaidInit = includeMermaid ? MERMAID_SETUP_SCRIPTS : '';

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
      --diagram-canvas: #1a2332;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f6f8fb;
        --panel: #ffffff;
        --text: #1a2332;
        --muted: #5a6b7d;
        --accent: #1d6fb8;
        --border: #d8e0ea;
        --diagram-canvas: #ffffff;
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
    .nav-accordion {
      border-bottom: 1px solid var(--border);
    }
    .nav-accordion summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.85rem 0;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      user-select: none;
    }
    .nav-accordion summary::-webkit-details-marker { display: none; }
    .nav-accordion summary::after {
      content: '';
      flex-shrink: 0;
      width: 0.45rem;
      height: 0.45rem;
      border-right: 2px solid var(--muted);
      border-bottom: 2px solid var(--muted);
      transform: rotate(45deg);
      transition: transform 0.15s ease;
    }
    .nav-accordion[open] summary::after {
      transform: rotate(-135deg);
    }
    .nav-accordion[open] summary {
      color: var(--text);
    }
    .nav-accordion ul {
      list-style: none;
      padding: 0 0 0.75rem;
      margin: 0;
    }
    .nav-accordion a {
      display: block;
      padding: 0.35rem 0 0.35rem 0.5rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      border-left: 2px solid transparent;
    }
    .nav-accordion a:hover {
      color: var(--accent);
    }
    .nav-accordion a.active {
      color: var(--accent);
      font-weight: 600;
      border-left-color: var(--accent);
    }
    main {
      padding: 2rem 2.5rem;
      max-width: 52rem;
    }
    main.main--diagram {
      max-width: min(96vw, 120rem);
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
    .diagram-viewer {
      margin: 1.5rem 0;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      overflow: hidden;
    }
    .diagram-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--panel) 88%, var(--bg));
    }
    .diagram-toolbar button {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.25rem 0.65rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
    }
    .diagram-toolbar button:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .diagram-toolbar button[data-zoom-in],
    .diagram-toolbar button[data-zoom-out] {
      min-width: 2rem;
      font-size: 1rem;
      line-height: 1;
      padding: 0.15rem 0.5rem;
    }
    .diagram-zoom-level {
      min-width: 3.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .diagram-stage {
      overflow: auto;
      padding: 1.25rem;
      min-height: 24rem;
      max-height: 75vh;
      background: var(--diagram-canvas);
    }
    .diagram-stage .mermaid,
    .diagram-stage svg {
      display: block;
      max-width: none;
    }
    .diagram-stage svg .messageText,
    .diagram-stage svg .loopText,
    .diagram-stage svg .labelText,
    .diagram-stage svg .noteText {
      fill: var(--text);
    }
    .diagram-stage svg .messageLine0,
    .diagram-stage svg .messageLine1,
    .diagram-stage svg .actor-line {
      stroke: var(--muted);
    }
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
    <main${mainClass}>
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
