import type { ArchitectureConfig } from '../config/schema.js';
import type { DocPage, DocSection } from './types.js';

/** Default architecture doc buckets — order defines sidebar + home page priority. */
export const DEFAULT_ARCHITECTURE_GROUPS: Array<{
  id: string;
  label: string;
  files: string[];
}> = [
  {
    id: 'start',
    label: 'Start here',
    files: ['overview.md', 'documentation-map.md', 'ai-context.md'],
  },
  {
    id: 'structure',
    label: 'Structure & patterns',
    files: [
      'project-structure.md',
      'rendering-model.md',
      'server-vs-client.md',
      'component-conventions.md',
      'content-models.md',
      'data-fetching.md',
    ],
  },
  {
    id: 'operations',
    label: 'Deploy & process',
    files: [
      'deployment.md',
      'environments.md',
      'git-workflow.md',
      'quality-gates.md',
      'integrations.md',
      'scripts-and-load-order.md',
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    files: [],
  },
];

export type NavBlock = {
  id: string;
  label: string;
  pages: DocPage[];
};

function architectureBasename(page: DocPage): string {
  const parts = page.relativePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] ?? page.relativePath;
}

function defaultGroupIdForFile(basename: string): string {
  for (const group of DEFAULT_ARCHITECTURE_GROUPS) {
    if (group.files.includes(basename)) {
      return group.id;
    }
  }
  if (basename.startsWith('_')) {
    return 'reference';
  }
  return 'reference';
}

export function resolveArchitectureGroupId(page: DocPage): string {
  if (page.navGroup) {
    const builtIn = DEFAULT_ARCHITECTURE_GROUPS.find(
      (g) => g.label === page.navGroup || g.id === page.navGroup,
    );
    if (builtIn) {
      return builtIn.id;
    }
    return page.navGroup;
  }
  return defaultGroupIdForFile(architectureBasename(page));
}

function groupLabel(groupId: string, config: ArchitectureConfig): string {
  const custom = config.site?.navGroups?.find((g) => g.id === groupId);
  if (custom) {
    return custom.label;
  }
  const builtIn = DEFAULT_ARCHITECTURE_GROUPS.find((g) => g.id === groupId);
  if (builtIn) {
    return builtIn.label;
  }
  return groupId;
}

function groupFiles(groupId: string, config: ArchitectureConfig): string[] {
  const custom = config.site?.navGroups?.find((g) => g.id === groupId);
  if (custom?.files?.length) {
    return custom.files;
  }
  return DEFAULT_ARCHITECTURE_GROUPS.find((g) => g.id === groupId)?.files ?? [];
}

function sortOrderInGroup(page: DocPage, groupFiles: string[]): number {
  if (page.navOrder !== undefined) {
    return page.navOrder;
  }
  const base = architectureBasename(page);
  const idx = groupFiles.indexOf(base);
  return idx === -1 ? 999 : idx;
}

function adrSortKey(page: DocPage): number {
  const base = architectureBasename(page);
  const match = base.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 999;
}

const DIAGRAM_ORDER = ['system-overview.mmd', 'data-flow.mmd', 'git-workflow.mmd'];

function diagramSortKey(page: DocPage): number {
  const base = architectureBasename(page);
  const idx = DIAGRAM_ORDER.indexOf(base);
  return idx === -1 ? 100 : idx;
}

function sortPages(pages: DocPage[], files: string[] = []): DocPage[] {
  return [...pages].sort((a, b) => {
    const orderA = sortOrderInGroup(a, files);
    const orderB = sortOrderInGroup(b, files);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.title.localeCompare(b.title);
  });
}

export function buildNavBlocks(
  pages: DocPage[],
  config: ArchitectureConfig,
): NavBlock[] {
  const blocks: NavBlock[] = [];
  const archPages = pages.filter((p) => p.section === 'architecture');

  const groupOrder =
    config.site?.navGroups?.map((g) => g.id) ??
    DEFAULT_ARCHITECTURE_GROUPS.map((g) => g.id);

  const byGroup = new Map<string, DocPage[]>();
  for (const page of archPages) {
    const gid = resolveArchitectureGroupId(page);
    const list = byGroup.get(gid) ?? [];
    list.push(page);
    byGroup.set(gid, list);
  }

  const emitted = new Set<string>();
  for (const groupId of groupOrder) {
    const groupPages = byGroup.get(groupId);
    if (!groupPages?.length) {
      continue;
    }
    emitted.add(groupId);
    blocks.push({
      id: groupId,
      label: groupLabel(groupId, config),
      pages: sortPages(groupPages, groupFiles(groupId, config)),
    });
  }

  for (const [groupId, groupPages] of byGroup) {
    if (emitted.has(groupId) || groupPages.length === 0) {
      continue;
    }
    blocks.push({
      id: groupId,
      label: groupLabel(groupId, config),
      pages: sortPages(groupPages, groupFiles(groupId, config)),
    });
  }

  const adrPages = pages.filter((p) => p.section === 'adr');
  if (adrPages.length > 0) {
    blocks.push({
      id: 'adr',
      label: 'ADRs',
      pages: [...adrPages].sort(
        (a, b) => adrSortKey(a) - adrSortKey(b) || a.title.localeCompare(b.title),
      ),
    });
  }

  const diagramPages = pages.filter((p) => p.section === 'diagram');
  if (diagramPages.length > 0) {
    blocks.push({
      id: 'diagram',
      label: 'Diagrams',
      pages: [...diagramPages].sort(
        (a, b) =>
          diagramSortKey(a) - diagramSortKey(b) || a.title.localeCompare(b.title),
      ),
    });
  }

  const otherPages = pages.filter((p) => p.section === 'other');
  if (otherPages.length > 0) {
    const sorted = [...otherPages].sort((a, b) => {
      if (a.relativePath === 'README.md') {
        return -1;
      }
      if (b.relativePath === 'README.md') {
        return 1;
      }
      return a.relativePath.localeCompare(b.relativePath);
    });
    blocks.push({ id: 'other', label: 'Docs index', pages: sorted });
  }

  return blocks;
}

export function findStartHerePages(
  pages: DocPage[],
  config: ArchitectureConfig,
): DocPage[] {
  const blocks = buildNavBlocks(pages, config);
  const start = blocks.find((b) => b.id === 'start');
  if (start && start.pages.length > 0) {
    return start.pages;
  }
  return pages.filter((p) => p.section === 'architecture').slice(0, 3);
}

export function sectionLabel(section: DocSection): string {
  const labels: Record<DocSection, string> = {
    architecture: 'Architecture',
    adr: 'ADRs',
    diagram: 'Diagrams',
    other: 'Docs',
  };
  return labels[section];
}
