/** Relative href between two built HTML pages (same logic as sidebar nav). */
export function navHref(fromOutputPath: string, targetOutputPath: string): string {
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

export function resolveDocLink(
  fromRelativePath: string,
  href: string,
): { docPath: string; hash: string } | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('/')) {
    return null;
  }

  const hashIndex = trimmed.indexOf('#');
  const filePart = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : trimmed.slice(hashIndex);

  if (
    !filePart.toLowerCase().endsWith('.md') &&
    !filePart.toLowerCase().endsWith('.mmd')
  ) {
    return null;
  }

  const fromDir = fromRelativePath.includes('/')
    ? fromRelativePath.slice(0, fromRelativePath.lastIndexOf('/'))
    : '';
  const docPath = filePart
    .replace(/\\/g, '/')
    .split('/')
    .reduce<string[]>((parts, segment) => {
      if (segment === '..') {
        parts.pop();
      } else if (segment !== '.' && segment !== '') {
        parts.push(segment);
      }
      return parts;
    }, fromDir ? fromDir.split('/') : [])
    .join('/');

  return { docPath, hash };
}
