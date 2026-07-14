import path from 'node:path';
import { loadConfig } from '../config/loadConfig.js';
import { buildSite, DEFAULT_SITE_DIR } from '../site/buildSite.js';
import { serveSite } from '../site/serveSite.js';

export type DevOptions = {
  cwd?: string;
  port?: number;
  host?: string;
  out?: string;
};

export async function runDev(options: DevOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const port = options.port ?? 4321;

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
    await buildSite(cwd, config, outDir);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const server = await serveSite({
    siteDir: outDir,
    port,
    host: options.host,
  });

  console.log(`Architecture docs dev server running`);
  console.log(`  ${server.url}`);
  console.log('');
  console.log('Press Ctrl+C to stop.');

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      void server.close().then(resolve);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

  return 0;
}
