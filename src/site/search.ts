import type { DocPage, SearchIndexEntry } from './types.js';

function stripMarkdownForSearch(content: string): string {
  let text = content;
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---\n', 4);
    if (end !== -1) {
      text = text.slice(end + 5);
    }
  }
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/[*_~>#|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchIndex(pages: DocPage[]): SearchIndexEntry[] {
  return pages
    .filter((page) => page.relativePath.endsWith('.md') && page.searchText)
    .map((page) => {
      const text = page.searchText ?? '';
      const excerpt =
        text.length > 160 ? `${text.slice(0, 157)}…` : text;
      return {
        title: page.title,
        path: page.outputPath,
        section: page.section,
        excerpt,
      };
    });
}

export function plainTextFromMarkdown(content: string): string {
  return stripMarkdownForSearch(content);
}

export const SEARCH_SCRIPT = `
(function () {
  var input = document.getElementById('doc-search');
  var results = document.getElementById('doc-search-results');
  if (!input || !results) return;

  var root = document.body.getAttribute('data-site-root') || '';
  var index = [];

  fetch(root + 'search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { index = data; })
    .catch(function () {});

  function render(items) {
    if (items.length === 0) {
      results.innerHTML = '<p class="search-empty">No matches</p>';
      results.hidden = false;
      return;
    }
    results.innerHTML = items.slice(0, 12).map(function (item) {
      var href = root + item.path;
      return '<a class="search-hit" href="' + href + '">' +
        '<strong>' + item.title + '</strong>' +
        '<span>' + item.excerpt + '</span></a>';
    }).join('');
    results.hidden = false;
  }

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      results.hidden = true;
      return;
    }
    var hits = index.filter(function (item) {
      return item.title.toLowerCase().indexOf(q) !== -1 ||
        item.excerpt.toLowerCase().indexOf(q) !== -1;
    });
    render(hits);
  });

  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) {
      results.hidden = true;
    }
  });
})();
`.trim();
