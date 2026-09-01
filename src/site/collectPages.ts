import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { getGitLastModified, getFileModifiedIso } from '../scan/projectScan.js';
import { parseFrontmatter } from './frontmatter.js';
import { normalizeDocStatus } from '../utils/docStatus.js';
import { pathExists } from '../utils/fileSystem.js';
import { plainTextFromMarkdown } from './search.js';
import type { DocPage, DocSection } from './types.js';

/** Not listed on the docs site (frozen snapshots, deps). */
const SKIP_DOC_DIRS = new Set(['_archive', 'node_modules']);

function titleFromMarkdown(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? fallback;
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.(md|mmd)$/i, '');
  return base
    .replace(/^\d+-/, '')
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prefixUnderDocs(configPath: string, docsPath: string): string {
  const normalized = configPath.replace(/\\/g, '/');
  const docs = docsPath.replace(/\\/g, '/');
  if (normalized === docs) {
    return '';
  }
  if (normalized.startsWith(`${docs}/`)) {
    return normalized.slice(docs.length + 1);
  }
  return normalized;
}

function sectionForRelativePath(
  relativePath: string,
  config: ArchitectureConfig,
): DocSection {
  const normalized = relativePath.replace(/\\/g, '/');
  const arch = prefixUnderDocs(config.paths.architectureDocs, config.paths.docs);
  const adr = prefixUnderDocs(config.paths.adr, config.paths.docs);
  const diagrams = prefixUnderDocs(config.paths.diagrams, config.paths.docs);

  if (arch && (normalized === arch || normalized.startsWith(`${arch}/`))) {
    return 'architecture';
  }
  if (adr && (normalized === adr || normalized.startsWith(`${adr}/`))) {
    return 'adr';
  }
  if (
    diagrams &&
    (normalized === diagrams || normalized.startsWith(`${diagrams}/`))
  ) {
    return 'diagram';
  }
  if (normalized.endsWith('.mmd')) {
    return 'diagram';
  }
  return 'other';
}

async function resolveDocDates(
  cwd: string,
  filePath: string,
  raw: string,
  source: 'git' | 'file',
): Promise<{ lastUpdated?: string; lastReviewed?: string }> {
  const fromFm = parseFrontmatter(raw);

  let lastUpdated = fromFm.lastUpdated;
  if (!lastUpdated) {
    if (source === 'git') {
      lastUpdated =
        (await getGitLastModified(cwd, filePath)) ??
        (await getFileModifiedIso(filePath));
    } else {
      lastUpdated = await getFileModifiedIso(filePath);
    }
  }

  return {
    lastUpdated,
    lastReviewed: fromFm.lastReviewed,
  };
}

async function walkMarkdown(
  dir: string,
  docsRoot: string,
  config: ArchitectureConfig,
  pages: DocPage[],
  cwd: string,
  dateSource: 'git' | 'file',
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DOC_DIRS.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      await walkMarkdown(fullPath, docsRoot, config, pages, cwd, dateSource);
      continue;
    }

    if (!entry.name.endsWith('.md') && !entry.name.endsWith('.mmd')) {
      continue;
    }

    const relativePath = path.relative(docsRoot, fullPath);
    const raw = await readFile(fullPath, 'utf-8');
    const fm = parseFrontmatter(raw);
    const title =
      entry.name.endsWith('.md')
        ? titleFromMarkdown(raw, titleFromFilename(entry.name))
        : titleFromFilename(entry.name);

    const dates = await resolveDocDates(cwd, fullPath, raw, dateSource);

    const status = normalizeDocStatus(fm.status);

    const page: DocPage = {
      section: sectionForRelativePath(relativePath, config),
      relativePath: relativePath.replace(/\\/g, '/'),
      sourcePath: fullPath,
      title,
      outputPath: outputPathFor(relativePath, config),
      lastUpdated: dates.lastUpdated,
      lastReviewed: dates.lastReviewed,
      navGroup: fm.navGroup,
      navOrder: fm.navOrder,
      isScaffold: status === 'scaffold',
      isDraft: status === 'draft',
    };

    if (entry.name.endsWith('.md')) {
      page.searchText = plainTextFromMarkdown(raw);
    }

    pages.push(page);
  }
}

function outputPathFor(
  relativePath: string,
  config: ArchitectureConfig,
): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const archPrefix = prefixUnderDocs(
    config.paths.architectureDocs,
    config.paths.docs,
  );

  let webPath = normalized;
  if (archPrefix && normalized.startsWith(`${archPrefix}/`)) {
    webPath = normalized.slice(archPrefix.length + 1);
  }

  if (webPath.endsWith('.md')) {
    return `${webPath.replace(/\.md$/i, '')}.html`;
  }
  return `${webPath.replace(/\.mmd$/i, '')}.html`;
}

export async function collectPages(
  cwd: string,
  config: ArchitectureConfig,
): Promise<DocPage[]> {
  const docsRoot = path.join(cwd, config.paths.docs);
  if (!(await pathExists(docsRoot))) {
    throw new Error(`Docs directory not found: ${config.paths.docs}`);
  }

  const pages: DocPage[] = [];
  const dateSource = config.site?.dateSource ?? 'git';
  await walkMarkdown(docsRoot, docsRoot, config, pages, cwd, dateSource);

  return pages;
}
