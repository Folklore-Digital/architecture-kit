#!/usr/bin/env node
import { Command } from 'commander';
import { runBuild } from './commands/build.js';
import { runDetect } from './commands/detect.js';
import { runDev } from './commands/dev.js';
import { runDoctor } from './commands/doctor.js';
import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import type { ProjectType } from './config/schema.js';

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
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold architecture documentation into the current directory')
  .requiredOption(
    '--type <type>',
    `Project template (${PROJECT_TYPES.join(', ')})`,
  )
  .option('--name <name>', 'Project name for architecture.config.json')
  .action(async (options: { type: string; name?: string }) => {
    if (!PROJECT_TYPES.includes(options.type as ProjectType)) {
      console.error(`Invalid project type: ${options.type}`);
      console.error(`Valid types: ${PROJECT_TYPES.join(', ')}`);
      process.exit(1);
    }

    try {
      await runInit({
        type: options.type as ProjectType,
        name: options.name,
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
  .command('validate')
  .description('Validate architecture docs and config')
  .option('--ci', 'CI mode: fail on errors only, stricter exit codes')
  .option('--level <level>', 'Validation level: warn | error')
  .action(async (options: { ci?: boolean; level?: string }) => {
    const level =
      options.level === 'error' || options.level === 'warn'
        ? options.level
        : options.ci
          ? 'error'
          : 'warn';
    const code = await runValidate({
      ci: options.ci,
      level,
    });
    process.exit(code);
  });

program
  .command('doctor')
  .description('Print architecture docs health summary')
  .action(async () => {
    const code = await runDoctor();
    process.exit(code);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
