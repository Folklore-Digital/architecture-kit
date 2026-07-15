import { describe, expect, it } from 'vitest';
import { navHref, resolveDocLink } from '../src/site/paths.js';

describe('navHref', () => {
  it('links from docs index to flattened architecture page', () => {
    expect(navHref('README.html', 'overview.html')).toBe('overview.html');
  });

  it('links from adr to flattened architecture page', () => {
    expect(navHref('adr/0001-initial-architecture.html', 'overview.html')).toBe(
      '../overview.html',
    );
  });

  it('links from architecture page to adr', () => {
    expect(
      navHref(
        'overview.html',
        'adr/0002-three-layer-rendering-and-themes.html',
      ),
    ).toBe('adr/0002-three-layer-rendering-and-themes.html');
  });
});

describe('resolveDocLink', () => {
  it('resolves docs README link through architecture folder', () => {
    expect(
      resolveDocLink('README.md', './architecture/overview.md')?.docPath,
    ).toBe('architecture/overview.md');
  });

  it('resolves adr link to architecture doc', () => {
    expect(
      resolveDocLink(
        'adr/0001-initial-architecture.md',
        '../architecture/overview.md',
      )?.docPath,
    ).toBe('architecture/overview.md');
  });
});
