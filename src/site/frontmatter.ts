export type ParsedFrontmatter = {
  navGroup?: string;
  navOrder?: number;
  lastUpdated?: string;
  lastReviewed?: string;
  status?: string;
};

export function parseFrontmatter(content: string): ParsedFrontmatter {
  if (!content.startsWith('---\n')) {
    return {};
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return {};
  }
  const fm = content.slice(4, end);
  const result: ParsedFrontmatter = {};

  for (const line of fm.split('\n')) {
    const navGroup = line.match(/^navGroup:\s*(.+)$/i);
    const navOrder = line.match(/^navOrder:\s*(\d+)$/i);
    const reviewed = line.match(/^lastReviewed:\s*(.+)$/i);
    const reviewedAlt = line.match(/^reviewed:\s*(.+)$/i);
    const updated = line.match(/^lastUpdated:\s*(.+)$/i);
    const status = line.match(/^status:\s*(.+)$/i);

    if (navGroup?.[1]) {
      result.navGroup = navGroup[1].trim().replace(/^["']|["']$/g, '');
    }
    if (navOrder?.[1]) {
      result.navOrder = Number.parseInt(navOrder[1], 10);
    }
    if (reviewed?.[1]) {
      result.lastReviewed = reviewed[1].trim().replace(/^["']|["']$/g, '');
    } else if (reviewedAlt?.[1]) {
      result.lastReviewed = reviewedAlt[1].trim().replace(/^["']|["']$/g, '');
    }
    if (updated?.[1]) {
      result.lastUpdated = updated[1].trim().replace(/^["']|["']$/g, '');
    }
    if (status?.[1]) {
      result.status = status[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  return result;
}
