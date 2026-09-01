import { describe, expect, it } from 'vitest';
import {
  hasDraftFrontmatter,
  hasScaffoldFrontmatter,
  normalizeDocStatus,
} from '../src/utils/docStatus.js';

describe('docStatus', () => {
  it('treats missing and current/active as reviewed', () => {
    expect(normalizeDocStatus(undefined)).toBe('reviewed');
    expect(normalizeDocStatus('current')).toBe('reviewed');
    expect(normalizeDocStatus('active')).toBe('reviewed');
  });

  it('keeps scaffold distinct from draft', () => {
    expect(normalizeDocStatus('scaffold')).toBe('scaffold');
    expect(hasScaffoldFrontmatter('---\nstatus: scaffold\n---\n\n# Hi')).toBe(
      true,
    );
    expect(hasDraftFrontmatter('---\nstatus: scaffold\n---\n\n# Hi')).toBe(
      false,
    );
  });

  it('maps draft, in-progress, and stale to draft (not scaffold)', () => {
    expect(normalizeDocStatus('draft')).toBe('draft');
    expect(normalizeDocStatus('in-progress')).toBe('draft');
    expect(normalizeDocStatus('in_progress')).toBe('draft');
    expect(normalizeDocStatus('stale')).toBe('draft');
    expect(
      hasDraftFrontmatter('---\nstatus: in-progress\n---\n\n# Hi'),
    ).toBe(true);
    expect(
      hasScaffoldFrontmatter('---\nstatus: in-progress\n---\n\n# Hi'),
    ).toBe(false);
  });
});
