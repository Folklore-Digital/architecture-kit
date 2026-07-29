import type { ArchitectureConfig } from './schema.js';

export const DEFAULT_AGENT_OUTPUT = '.architecture-kit';
export const DEFAULT_SITE_OUTPUT_DIR = 'public/architecture';
export const DEFAULT_SITE_MOUNT_PATH = '/architecture/';

/** Normalize mount path: leading slash, trailing slash. */
export function normalizeMountPath(mountPath: string): string {
  let normalized = mountPath.trim().replace(/\\/g, '/');
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

export function resolveAgentOutputDir(
  config: ArchitectureConfig | null | undefined,
): string {
  return config?.paths?.agentOutput ?? DEFAULT_AGENT_OUTPUT;
}

export function resolveSiteOutputDir(
  config: ArchitectureConfig | null | undefined,
): string {
  return config?.site?.outputDir ?? DEFAULT_SITE_OUTPUT_DIR;
}

export function resolveSiteMountPath(
  config: ArchitectureConfig | null | undefined,
): string {
  const raw = config?.site?.mountPath ?? DEFAULT_SITE_MOUNT_PATH;
  return normalizeMountPath(raw);
}

export type EmbedManifest = {
  schemaVersion: '1.0.0';
  generatedAt: string;
  kitVersion: string;
  mountPath: string;
  outputDir: string;
  agentOutput: string;
};

export function buildEmbedManifest(
  config: ArchitectureConfig,
  kitVersion: string,
): EmbedManifest {
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    kitVersion,
    mountPath: resolveSiteMountPath(config),
    outputDir: resolveSiteOutputDir(config),
    agentOutput: resolveAgentOutputDir(config),
  };
}
