/** Frontmatter `status` values the docs site understands. */
export const SCAFFOLD_STATUS = 'scaffold';

const DRAFT_STATUSES = new Set([
  'draft',
  'in-progress',
  'in_progress',
  'stale',
]);

export type DocFrontmatterStatus = 'scaffold' | 'draft' | 'reviewed';

export function normalizeDocStatus(
  status: string | undefined,
): DocFrontmatterStatus {
  const value = status?.trim().toLowerCase();
  if (!value || value === 'current' || value === 'active' || value === 'reviewed') {
    return 'reviewed';
  }
  if (value === SCAFFOLD_STATUS) {
    return 'scaffold';
  }
  if (DRAFT_STATUSES.has(value)) {
    return 'draft';
  }
  return 'reviewed';
}

export function hasDraftFrontmatter(content: string): boolean {
  return frontmatterStatus(content) === 'draft';
}

function frontmatterStatus(content: string): DocFrontmatterStatus | undefined {
  if (!content.startsWith('---\n')) {
    return undefined;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return undefined;
  }
  const fm = content.slice(4, end);
  const match = fm.match(/^status:\s*(.+)$/im);
  if (!match?.[1]) {
    return undefined;
  }
  return normalizeDocStatus(match[1].replace(/^["']|["']$/g, ''));
}

export function hasScaffoldFrontmatter(content: string): boolean {
  return frontmatterStatus(content) === 'scaffold';
}
