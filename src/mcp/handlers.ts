import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgentPack } from '../agent/writeAgentPack.js';
import { AGENT_PACK_DIR } from '../agent/writeAgentPack.js';
import { tryLoadConfig } from '../config/loadConfig.js';
import type { ArchitectureConfig } from '../config/schema.js';
import { collectPages } from '../site/collectPages.js';
import { buildSearchIndex } from '../site/search.js';
import type { SearchIndexEntry } from '../site/types.js';
import { pathExists } from '../utils/fileSystem.js';
import { stripFrontmatter } from '../utils/scaffoldFrontmatter.js';

export type ArchitectureContextResult = {
  project: ArchitectureConfig['project'] | null;
  paths: ArchitectureConfig['paths'] | null;
  governance: ArchitectureConfig['governance'] | null;
  aiContextPath: string | null;
  aiContext: string | null;
  agentContextPath: string | null;
  agentContext: string | null;
  agentPack: AgentPack | null;
};

export async function readAgentPack(cwd: string): Promise<AgentPack | null> {
  const packPath = path.join(cwd, AGENT_PACK_DIR, 'agent-pack.json');
  if (!(await pathExists(packPath))) {
    return null;
  }
  try {
    const raw = await readFile(packPath, 'utf-8');
    return JSON.parse(raw) as AgentPack;
  } catch {
    return null;
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  if (!(await pathExists(filePath))) {
    return null;
  }
  return readFile(filePath, 'utf-8');
}

export async function getArchitectureContext(
  cwd: string,
): Promise<ArchitectureContextResult> {
  const loaded = await tryLoadConfig(cwd);
  const config = loaded?.config ?? null;
  const pack = await readAgentPack(cwd);

  const aiContextPath = config
    ? path.join(cwd, config.paths.aiContext)
    : pack
      ? path.join(cwd, pack.entrypoints.aiContext)
      : null;

  const agentContextPath = path.join(
    cwd,
    AGENT_PACK_DIR,
    'agent-context.md',
  );

  return {
    project: config?.project ?? null,
    paths: config?.paths ?? pack?.paths ?? null,
    governance: config?.governance ?? pack?.governance ?? null,
    aiContextPath: aiContextPath
      ? path.relative(cwd, aiContextPath).replace(/\\/g, '/')
      : null,
    aiContext: aiContextPath ? await readTextIfExists(aiContextPath) : null,
    agentContextPath: (await pathExists(agentContextPath))
      ? path.relative(cwd, agentContextPath).replace(/\\/g, '/')
      : null,
    agentContext: await readTextIfExists(agentContextPath),
    agentPack: pack,
  };
}

async function loadSearchIndex(cwd: string): Promise<SearchIndexEntry[]> {
  const candidates = [
    path.join(cwd, AGENT_PACK_DIR, 'search-index.json'),
    path.join(cwd, AGENT_PACK_DIR, 'site', 'search-index.json'),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      try {
        const raw = await readFile(candidate, 'utf-8');
        return JSON.parse(raw) as SearchIndexEntry[];
      } catch {
        continue;
      }
    }
  }

  const loaded = await tryLoadConfig(cwd);
  if (!loaded) {
    return [];
  }

  const pages = await collectPages(cwd, loaded.config);
  return buildSearchIndex(pages);
}

function scoreSearchEntry(query: string, entry: SearchIndexEntry): number {
  const q = query.toLowerCase().trim();
  if (!q) {
    return 0;
  }

  const title = entry.title.toLowerCase();
  const excerpt = entry.excerpt.toLowerCase();
  const entryPath = entry.path.toLowerCase();
  let score = 0;

  if (title.includes(q)) {
    score += 12;
  }
  if (entryPath.includes(q.replace(/\s+/g, ''))) {
    score += 8;
  }
  if (excerpt.includes(q)) {
    score += 6;
  }

  for (const word of q.split(/\s+/).filter(Boolean)) {
    if (title.includes(word)) {
      score += 3;
    }
    if (excerpt.includes(word)) {
      score += 2;
    }
  }

  return score;
}

export async function searchArchitectureDocs(
  cwd: string,
  query: string,
  limit = 10,
): Promise<SearchIndexEntry[]> {
  const index = await loadSearchIndex(cwd);
  const capped = Math.min(Math.max(limit, 1), 25);

  return index
    .map((entry) => ({ entry, score: scoreSearchEntry(query, entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, capped)
    .map((item) => item.entry);
}

function normalizeDocPath(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

export async function getArchitecturePage(
  cwd: string,
  docPath: string,
): Promise<{ path: string; content: string } | null> {
  const loaded = await tryLoadConfig(cwd);
  if (!loaded) {
    return null;
  }

  const normalized = normalizeDocPath(docPath);
  const docsRoot = loaded.config.paths.docs.replace(/\\/g, '/');

  let relative = normalized;
  if (relative.startsWith(`${docsRoot}/`)) {
    relative = relative.slice(docsRoot.length + 1);
  }

  const candidates = [
    path.join(cwd, docsRoot, relative),
    path.join(cwd, normalized),
    path.join(cwd, docsRoot, `${relative.replace(/\.html$/i, '.md')}`),
  ];

  for (const candidate of candidates) {
    if (!(await pathExists(candidate))) {
      continue;
    }
    if (!/\.(md|mmd)$/i.test(candidate)) {
      continue;
    }
    const raw = await readFile(candidate, 'utf-8');
    return {
      path: path.relative(cwd, candidate).replace(/\\/g, '/'),
      content: stripFrontmatter(raw),
    };
  }

  return null;
}

export async function listArchitecturePages(
  cwd: string,
): Promise<
  Array<{
    relativePath: string;
    title: string;
    section: string;
    isScaffold: boolean;
    isDraft: boolean;
  }>
> {
  const pack = await readAgentPack(cwd);
  if (pack?.docs?.length) {
    return pack.docs.map((doc) => ({
      relativePath: doc.relativePath,
      title: doc.title,
      section: doc.section,
      isScaffold: doc.isScaffold,
      isDraft: doc.isDraft ?? false,
    }));
  }

  const loaded = await tryLoadConfig(cwd);
  if (!loaded) {
    return [];
  }

  const pages = await collectPages(cwd, loaded.config);
  return pages.map((page) => ({
    relativePath: page.relativePath,
    title: page.title,
    section: page.section,
    isScaffold: page.isScaffold ?? false,
    isDraft: page.isDraft ?? false,
  }));
}
