import { describe, expect, it } from 'vitest';
import {
  hasScaffoldFrontmatter,
  wrapScaffoldFrontmatter,
} from '../src/utils/scaffoldFrontmatter.js';

describe('scaffoldFrontmatter', () => {
  it('wraps markdown without existing frontmatter', () => {
    const wrapped = wrapScaffoldFrontmatter('# Title\n\nBody', '0.5.0');
    expect(wrapped).toContain('status: scaffold');
    expect(wrapped).toContain('scaffoldVersion: "0.5.0"');
    expect(hasScaffoldFrontmatter(wrapped)).toBe(true);
  });

  it('does not double-wrap frontmatter', () => {
    const existing = '---\nstatus: active\n---\n\n# Title';
    expect(wrapScaffoldFrontmatter(existing, '0.5.0')).toBe(existing);
  });
});
