import type { ArchitectureConfig } from '../config/schema.js';
import type { ProjectScanResult } from '../scan/projectScan.js';
import { collectPages } from '../site/collectPages.js';
import type { DocPage } from '../site/types.js';
import { readKitVersion } from '../utils/fileSystem.js';
import { writeAgentPack } from './writeAgentPack.js';

export type EmitAgentPackOptions = {
  cwd: string;
  config: ArchitectureConfig | null;
  scan?: ProjectScanResult;
  includePages?: boolean;
};

/** Write agent-pack.json and prompt files after scan or bootstrap. */
export async function emitAgentPack(
  options: EmitAgentPackOptions,
): Promise<string> {
  const { cwd, config, scan, includePages = true } = options;
  const kitVersion = await readKitVersion();

  let pages: DocPage[] = [];
  if (includePages && config) {
    try {
      pages = await collectPages(cwd, config);
    } catch {
      pages = [];
    }
  }

  return writeAgentPack({
    cwd,
    config,
    kitVersion,
    pages,
    scan,
  });
}
