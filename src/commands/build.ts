import path from 'node:path';
import { loadConfig } from '../config/loadConfig.js';
import { buildSite, DEFAULT_SITE_DIR } from '../site/buildSite.js';

export type BuildOptions = {
  cwd?: string;
  out?: string;
};

export async function runBuild(options: BuildOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();

  let config;
  try {
    ({ config } = await loadConfig(cwd));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const outDir = options.out
    ? path.resolve(cwd, options.out)
    : path.join(cwd, DEFAULT_SITE_DIR);

  try {
    const result = await buildSite(cwd, config, outDir);
    console.log(`Built architecture docs site (${result.pages.length} pages)`);
    console.log(`  Output: ${result.outDir}`);
    console.log('');
    console.log('Open index.html locally or run: npx architecture-kit dev');
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
