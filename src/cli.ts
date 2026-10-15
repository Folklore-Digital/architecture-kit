#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { runBuild } from './commands/build.js';
import { runDetect } from './commands/detect.js';
import { runDev } from './commands/dev.js';
import { runDoctor } from './commands/doctor.js';
import { parseAiAdapters } from './agent/adapters.js';
import { runInit } from './commands/init.js';
import { runBootstrap, runScan } from './commands/bootstrap.js';
import { runValidate } from './commands/validate.js';
import type { ProjectType } from './config/schema.js';

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const kitPkg = JSON.parse(
  readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'),
) as { version: string };

const PROJECT_TYPES: ProjectType[] = [
  'nextjs',
  'wordpress-custom',
  'wordpress-builder',
  'craft',
  'generic',
];

const program = new Command();

program
  .name('architecture-kit')
  .description(
    'Repo-native architecture documentation and governance for any project',
  )
  .version(kitPkg.version);

program
  .command('init')
  .description('Scaffold architecture documentation into the current directory')
  .requiredOption(
    '--type <type>',
    `Project template (${PROJECT_TYPES.join(', ')})`,
  )
  .option('--name <name>', 'Project name for architecture.config.json')
  .option(
    '--embed <target>',
    'Copy host embed scripts (nextjs: public/architecture/ at /architecture/)',
  )
  .option(
    '--adapters <list>',
    'AI entrypoints to scaffold (comma-separated: agents,cursor,claude). Default: agents',
    'agents',
  )
  .action(
    async (options: {
      type: string;
      name?: string;
      embed?: string;
      adapters?: string;
    }) => {
    if (!PROJECT_TYPES.includes(options.type as ProjectType)) {
      console.error(`Invalid project type: ${options.type}`);
      console.error(`Valid types: ${PROJECT_TYPES.join(', ')}`);
      process.exit(1);
    }

    if (options.embed && options.embed !== 'nextjs') {
      console.error(`Invalid embed target: ${options.embed}`);
      console.error('Valid embed targets: nextjs');
      process.exit(1);
    }

    let adapters;
    try {
      adapters = parseAiAdapters(options.adapters);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    try {
      await runInit({
        type: options.type as ProjectType,
        name: options.name,
        embed: options.embed as 'nextjs' | undefined,
        adapters,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Build and serve the local architecture docs site')
  .option('--port <port>', 'Port for dev server', '4321')
  .option('--host <host>', 'Host to bind', '127.0.0.1')
  .option('--out <dir>', 'Output directory (default: .architecture-kit/site)')
  .action(async (options: { port?: string; host?: string; out?: string }) => {
    const port = Number.parseInt(options.port ?? '4321', 10);
    if (Number.isNaN(port)) {
      console.error('Invalid --port value');
      process.exit(1);
    }
    const code = await runDev({
      port,
      host: options.host,
      out: options.out,
    });
    process.exit(code);
  });

program
  .command('build')
  .description('Build static architecture docs site')
  .option('--out <dir>', 'Output directory (default: .architecture-kit/site)')
  .action(async (options: { out?: string }) => {
    const code = await runBuild({ out: options.out });
    process.exit(code);
  });

program
  .command('detect')
  .description('Detect project type from repo signals')
  .option('--apply', 'Update architecture.config.json project.type when it differs')
  .action(async (options: { apply?: boolean }) => {
    const code = await runDetect({ apply: options.apply });
    process.exit(code);
  });

program
  .command('scan')
  .description(
    'Scan an existing project and write AI-agent bootstrap context (.architecture-kit/agent-context.md)',
  )
  .option('--json', 'Print scan results as JSON to stdout')
  .option('--out <path>', 'Custom output path for agent context markdown')
  .action(async (options: { json?: boolean; out?: string }) => {
    const code = await runScan({ json: options.json, out: options.out });
    process.exit(code);
  });

program
  .command('bootstrap')
  .description(
    'Scan project, write agent context, and optionally scaffold missing docs (--apply)',
  )
  .option('--apply', 'Scaffold missing docs and merge detected values into config')
  .option(
    '--type <type>',
    'Project template for scaffold (default: auto-detect)',
  )
  .action(async (options: { apply?: boolean; type?: string }) => {
    const code = await runBootstrap({
      apply: options.apply,
      type: options.type,
    });
    process.exit(code);
  });

program
  .command('validate')
  .description('Validate architecture docs and config')
  .option('--ci', 'CI mode: fail on errors only, stricter exit codes')
  .option('--level <level>', 'Validation level: warn | error')
  .option(
    '--since <ref>',
    'Git ref for diff-aware checks (e.g. origin/develop)',
  )
  .option(
    '--deploy-artifact <dir>',
    'Check a build/deploy output directory for forbidden architecture paths',
  )
  .action(async (options: {
    ci?: boolean;
    level?: string;
    since?: string;
    deployArtifact?: string;
  }) => {
    const level =
      options.level === 'error' || options.level === 'warn'
        ? options.level
        : options.ci
          ? 'error'
          : 'warn';
    const code = await runValidate({
      ci: options.ci,
      level,
      since: options.since,
      deployArtifact: options.deployArtifact,
    });
    process.exit(code);
  });

program
  .command('doctor')
  .description('Print architecture docs health summary')
  .option('--json', 'Output structured coverage report as JSON')
  .action(async (options: { json?: boolean }) => {
    const code = await runDoctor(process.cwd(), { json: options.json });
    process.exit(code);
  });

program
  .command('mcp')
  .description(
    'Start MCP server on stdio — architecture docs tools for Claude Code / Cursor',
  )
  .action(async () => {
    const { runMcp } = await import('./commands/mcp.js');
    const code = await runMcp();
    process.exit(code);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
