import type { ArchitectureConfig } from '../config/schema.js';
import { formatDisplayDate } from '../scan/projectScan.js';
import type { DocPage, DocSection } from './types.js';
import { MERMAID_SETUP_SCRIPTS } from './mermaidInitScript.js';
import { buildNavBlocks, findStartHerePages } from './navGroups.js';
import { navHref } from './paths.js';
import { SEARCH_SCRIPT } from './search.js';

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

function renderNav(
  pages: DocPage[],
  current: DocPage,
  config: ArchitectureConfig,
): string {
  const blocks = buildNavBlocks(pages, config);
  const htmlBlocks: string[] = [];

  for (const block of blocks) {
    const isOpen =
      block.pages.some((page) => page.outputPath === current.outputPath) ||
      (current.outputPath === 'index.html' && block.id === 'start');
    const openAttr = isOpen ? ' open' : '';

    const links = block.pages
      .map((page) => {
        const href = navHref(current.outputPath, page.outputPath);
        const active =
          page.outputPath === current.outputPath ? ' class="active"' : '';
        return `<li><a href="${href}"${active}>${escapeHtml(page.title)}</a></li>`;
      })
      .join('\n');

    htmlBlocks.push(
      `<details class="nav-accordion"${openAttr}><summary>${escapeHtml(block.label)}</summary><ul>${links}</ul></details>`,
    );
  }

  return htmlBlocks.join('\n');
}

function renderSearchBox(): string {
  return `<div class="doc-search-wrap">
  <input type="search" id="doc-search" placeholder="Search docs…" autocomplete="off" aria-label="Search documentation" />
  <div id="doc-search-results" class="doc-search-results" hidden></div>
</div>`;
}

function renderStorybookLink(config: ArchitectureConfig): string {
  const sb = config.storybook;
  if (!sb?.enabled || !sb.url) {
    return '';
  }
  return `<p class="external-nav"><a href="${escapeHtml(sb.url)}" target="_blank" rel="noopener noreferrer">Storybook ↗</a></p>`;
}

function renderDateMeta(
  page: DocPage,
  showDates: boolean,
): string {
  if (!showDates || page.outputPath === 'index.html') {
    return '';
  }
  const parts: string[] = [];
  if (page.lastUpdated) {
    parts.push(`Updated ${escapeHtml(formatDisplayDate(page.lastUpdated))}`);
  }
  if (page.lastReviewed) {
    parts.push(`Reviewed ${escapeHtml(formatDisplayDate(page.lastReviewed))}`);
  }
  if (parts.length === 0) {
    return '';
  }
  return `<p class="doc-dates">${parts.join(' · ')}</p>`;
}

export function renderPageShell(options: {
  projectName: string;
  page: DocPage;
  bodyHtml: string;
  pages: DocPage[];
  includeMermaid: boolean;
  config: ArchitectureConfig;
}): string {
  const { projectName, page, bodyHtml, pages, includeMermaid, config } = options;
  const root = depthToRoot(page.outputPath);
  const homeHref = root ? `${root}index.html` : 'index.html';
  const nav = renderNav(pages, page, config);
  const search = renderSearchBox();
  const storybook = renderStorybookLink(config);
  const showDates = config.site?.showDates !== false;
  const dateMeta = renderDateMeta(page, showDates);
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
    .doc-dates {
      font-size: 0.85rem;
      color: var(--muted);
      margin: 0 0 1.25rem;
    }
    .doc-search-wrap {
      position: relative;
      margin-bottom: 1rem;
    }
    #doc-search {
      width: 100%;
      padding: 0.45rem 0.65rem;
      font: inherit;
      font-size: 0.9rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
    }
    .doc-search-results {
      position: absolute;
      z-index: 10;
      left: 0;
      right: 0;
      top: calc(100% + 0.25rem);
      max-height: 16rem;
      overflow-y: auto;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .search-hit {
      display: block;
      padding: 0.5rem 0.65rem;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid var(--border);
    }
    .search-hit:last-child { border-bottom: none; }
    .search-hit strong { display: block; font-size: 0.9rem; color: var(--accent); }
    .search-hit span {
      display: block;
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.15rem;
      line-height: 1.35;
    }
    .search-empty {
      margin: 0;
      padding: 0.65rem;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .external-nav {
      margin: 0.75rem 0 0;
      font-size: 0.85rem;
    }
    .external-nav a { font-weight: 600; }
    .home-lede { color: var(--muted); font-size: 1.05rem; max-width: 42rem; }
    .home-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.25rem;
      margin: 1.25rem 0 2rem;
      font-size: 0.9rem;
      color: var(--muted);
    }
    .home-section { margin: 2rem 0; }
    .home-section h2 {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 0 0 0.75rem;
    }
    .home-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 0.75rem;
    }
    .home-card {
      display: block;
      padding: 0.85rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s ease;
    }
    .home-card:hover {
      border-color: var(--accent);
    }
    .home-card strong {
      display: block;
      color: var(--accent);
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }
    .home-card span {
      display: block;
      font-size: 0.82rem;
      color: var(--muted);
      line-height: 1.4;
    }
    .home-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.35rem;
    }
    .home-links a { text-decoration: none; }
    .home-links a:hover { text-decoration: underline; }
    .home-footer {
      margin-top: 2.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--muted);
    }
  </style>
</head>
<body data-site-root="${root}">
  <div class="layout">
    <aside>
      <h1><a href="${homeHref}">${escapeHtml(projectName)}</a></h1>
      ${search}
      ${storybook}
      ${nav}
    </aside>
    <main${mainClass}>
      ${dateMeta}
      ${bodyHtml}
      ${sourceLink}
    </main>
  </div>
  ${mermaidInit}
  <script>${SEARCH_SCRIPT}</script>
</body>
</html>`;
}

export function renderHomePage(options: {
  projectName: string;
  projectTypeLabel: string;
  pages: DocPage[];
  config: ArchitectureConfig;
}): string {
  const { projectName, projectTypeLabel, pages, config } = options;
  const startPages = findStartHerePages(pages, config);
  const adrPages = pages.filter((p) => p.section === 'adr');
  const diagramPages = pages.filter((p) => p.section === 'diagram');
  const docsReadme = pages.find((p) => p.relativePath === 'README.md');
  const description = config.project.description?.trim();

  const stackBits = [
    config.stack.frontend,
    config.stack.hosting,
  ].filter(Boolean);

  const startCards = startPages
    .map((page) => {
      const href = navHref('index.html', page.outputPath);
      const blurb =
        page.relativePath.endsWith('overview.md')
          ? 'Purpose, stack, and boundaries'
          : page.relativePath.endsWith('documentation-map.md')
            ? 'Where specs and docs live'
            : page.relativePath.endsWith('ai-context.md')
              ? 'Rules for AI-assisted work'
              : 'Architecture documentation';
      return `<a class="home-card" href="${href}"><strong>${escapeHtml(page.title)}</strong><span>${escapeHtml(blurb)}</span></a>`;
    })
    .join('\n');

  const opsPages = buildNavBlocks(pages, config)
    .find((b) => b.id === 'operations')
    ?.pages.slice(0, 4);

  const opsLinks =
    opsPages
      ?.map((page) => {
        const href = navHref('index.html', page.outputPath);
        return `<li><a href="${href}">${escapeHtml(page.title)}</a></li>`;
      })
      .join('\n') ?? '';

  const adrLinks = adrPages
    .slice(0, 5)
    .map((page) => {
      const href = navHref('index.html', page.outputPath);
      return `<li><a href="${href}">${escapeHtml(page.title)}</a></li>`;
    })
    .join('\n');

  const diagramLinks = diagramPages
    .map((page) => {
      const href = navHref('index.html', page.outputPath);
      return `<li><a href="${href}">${escapeHtml(page.title)}</a></li>`;
    })
    .join('\n');

  const docsIndexLink = docsReadme
    ? `<p><a href="${navHref('index.html', docsReadme.outputPath)}">Full documentation index (roles &amp; maintenance) →</a></p>`
    : '';

  const body = `<h1>${escapeHtml(projectName)}</h1>
<p class="home-lede">${escapeHtml(description || `System architecture documentation (${projectTypeLabel}).`)}</p>
<div class="home-meta">
  <span>${escapeHtml(projectTypeLabel)}</span>
  ${stackBits.map((bit) => `<span>${escapeHtml(String(bit))}</span>`).join('\n  ')}
</div>

<section class="home-section">
  <h2>Start here</h2>
  <div class="home-cards">${startCards}</div>
</section>

${
  opsLinks
    ? `<section class="home-section">
  <h2>Deploy &amp; process</h2>
  <ul class="home-links">${opsLinks}</ul>
</section>`
    : ''
}

${
  diagramLinks
    ? `<section class="home-section">
  <h2>Diagrams</h2>
  <ul class="home-links">${diagramLinks}</ul>
</section>`
    : ''
}

${
  adrLinks
    ? `<section class="home-section">
  <h2>Architecture decisions</h2>
  <ul class="home-links">${adrLinks}</ul>
</section>`
    : ''
}

${docsIndexLink}

<p class="home-footer">Generated by <strong>@folklore/architecture-kit</strong></p>`;

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
    config,
  });
}
