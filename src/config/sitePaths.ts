import type { ArchitectureConfig } from './schema.js';

export const DEFAULT_AGENT_OUTPUT = '.architecture-kit';
export const DEFAULT_SITE_OUTPUT_DIR = 'public/architecture';
export const DEFAULT_SITE_MOUNT_PATH = '/architecture/';
export type SiteExposure = 'local' | 'dev-staging' | 'production';

export function resolveSiteExposure(
  config: ArchitectureConfig | null | undefined,
): SiteExposure {
  return config?.site?.exposure ?? 'dev-staging';
}

export function resolveDocsProductionExposure(
  config: ArchitectureConfig | null | undefined,
): 'none' | 'dev-only' | 'public' {
  return config?.governance?.docsProductionExposure ?? 'dev-only';
}

/** Paths that must not appear in production deploy artifacts when exposure is restricted. */
export function getRestrictedDeployPaths(
  config: ArchitectureConfig,
): string[] {
  const outputDir = resolveSiteOutputDir(config);
  const paths = [outputDir, resolveAgentOutputDir(config)];

  const exposure = resolveSiteExposure(config);
  const docsExposure = resolveDocsProductionExposure(config);

  if (
    docsExposure === 'none' ||
    config.project.type.startsWith('wordpress')
  ) {
    paths.push(config.paths.docs);
  }

  if (exposure !== 'production') {
    paths.push(outputDir);
  }

  return [...new Set(paths.map((p) => p.replace(/\\/g, '/')))].filter(Boolean);
}

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
  exposure: SiteExposure;
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
    exposure: resolveSiteExposure(config),
  };
}
