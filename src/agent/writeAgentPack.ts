import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { resolveAgentOutputDir } from '../config/sitePaths.js';
import type { ProjectScanResult } from '../scan/projectScan.js';
import type { DocPage, SearchIndexEntry } from '../site/types.js';
import { ensureDir, writeJson } from '../utils/fileSystem.js';
import { GREENFIELD_AGENT_PROMPT } from '../utils/scaffoldFrontmatter.js';
import { BROWNFIELD_DOC_UPDATE_PROMPT } from './prompts.js';

export const AGENT_PACK_SCHEMA = '1.0.0';
export const AGENT_PACK_DIR = '.architecture-kit';

export type AgentPackDocEntry = {
  relativePath: string;
  title: string;
  section: string;
  outputPath: string;
  isScaffold: boolean;
  isDraft?: boolean;
};

export type AgentPack = {
  schemaVersion: string;
  generatedAt: string;
  kitVersion: string;
  project: {
    name: string;
    type: string;
    documentationStatus?: string;
  };
  paths?: ArchitectureConfig['paths'];
  governance?: ArchitectureConfig['governance'];
  entrypoints: {
    aiContext: string;
    agentContext: string;
    config: string;
    agentPack: string;
  };
  prompts: {
    greenfield: string;
    brownfieldDocUpdate: string;
  };
  docs: AgentPackDocEntry[];
  scan?: Pick<
    ProjectScanResult,
    'scannedAt' | 'suggestedType' | 'detectionConfidence' | 'existingDocs'
  >;
  searchIndexPath?: string;
};

export type WriteAgentPackOptions = {
  cwd: string;
  config: ArchitectureConfig | null;
  kitVersion: string;
  pages?: DocPage[];
  searchIndex?: SearchIndexEntry[];
  scan?: ProjectScanResult;
};

function docEntriesFromPages(pages: DocPage[]): AgentPackDocEntry[] {
  return pages.map((page) => ({
    relativePath: page.relativePath,
    title: page.title,
    section: page.section,
    outputPath: page.outputPath,
    isScaffold: page.isScaffold ?? false,
    isDraft: page.isDraft ?? false,
  }));
}

function buildPack(options: WriteAgentPackOptions): AgentPack {
  const { cwd: _cwd, config, kitVersion, pages = [], searchIndex, scan } =
    options;

  const aiContextPath =
    config?.paths.aiContext ?? 'docs/architecture/ai-context.md';
  const agentDir = resolveAgentOutputDir(config);

  const pack: AgentPack = {
    schemaVersion: AGENT_PACK_SCHEMA,
    generatedAt: new Date().toISOString(),
    kitVersion,
    project: {
      name: config?.project.name ?? scan?.projectName ?? 'unknown',
      type: config?.project.type ?? scan?.suggestedType ?? 'generic',
      documentationStatus: config?.project.documentationStatus,
    },
    paths: config?.paths,
    governance: config?.governance,
    entrypoints: {
      aiContext: aiContextPath,
      agentContext: `${agentDir}/agent-context.md`,
      config: 'architecture.config.json',
      agentPack: `${agentDir}/agent-pack.json`,
    },
    prompts: {
      greenfield: `${agentDir}/prompts/greenfield.md`,
      brownfieldDocUpdate: `${agentDir}/prompts/brownfield-doc-update.md`,
    },
    docs: docEntriesFromPages(pages),
  };

  if (scan) {
    pack.scan = {
      scannedAt: scan.scannedAt,
      suggestedType: scan.suggestedType,
      detectionConfidence: scan.detectionConfidence,
      existingDocs: scan.existingDocs,
    };
  }

  if (searchIndex && searchIndex.length > 0) {
    pack.searchIndexPath = `${agentDir}/search-index.json`;
  }

  return pack;
}

/** Write agent-pack.json, prompt files, and optional search index under .architecture-kit/ */
export async function writeAgentPack(
  options: WriteAgentPackOptions,
): Promise<string> {
  const { cwd, config, searchIndex } = options;
  const baseDir = path.join(cwd, resolveAgentOutputDir(config));
  const promptsDir = path.join(baseDir, 'prompts');

  await ensureDir(promptsDir);

  await writeFile(
    path.join(promptsDir, 'greenfield.md'),
    `${GREENFIELD_AGENT_PROMPT}\n`,
    'utf-8',
  );
  await writeFile(
    path.join(promptsDir, 'brownfield-doc-update.md'),
    `${BROWNFIELD_DOC_UPDATE_PROMPT}\n`,
    'utf-8',
  );

  const pack = buildPack(options);
  const packPath = path.join(baseDir, 'agent-pack.json');
  await writeJson(packPath, pack);

  if (searchIndex && searchIndex.length > 0) {
    await writeFile(
      path.join(baseDir, 'search-index.json'),
      `${JSON.stringify(searchIndex, null, 2)}\n`,
      'utf-8',
    );
  }

  return packPath;
}
