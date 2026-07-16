import type { EmbedTarget } from '../utils/embed.js';
import type { ProjectType } from '../config/schema.js';
import { projectTypeLabels } from '../config/schema.js';
import { scaffoldProject } from '../utils/fileSystem.js';

export type InitOptions = {
  type: ProjectType;
  name?: string;
  cwd?: string;
  embed?: EmbedTarget;
};

export async function runInit(options: InitOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const { created, skipped, warnings } = await scaffoldProject(
    cwd,
    options.type,
    options.name,
    { embed: options.embed },
  );

  console.log(
    `Initialized @folklore/architecture-kit (${projectTypeLabels[options.type]})`,
  );
  if (options.embed) {
    console.log(`Embed: ${options.embed}`);
  }
  console.log('');

  if (created.length > 0) {
    console.log('Created:');
    for (const item of created) {
      console.log(`  - ${item}`);
    }
    console.log('');
  }

  if (skipped.length > 0) {
    console.log('Skipped (already exists — not overwritten):');
    for (const item of skipped) {
      console.log(`  - ${item}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const item of warnings) {
      console.log(`  - ${item}`);
    }
    console.log('');
  }

  console.log('Next steps:');
  console.log(`  1. ${options.embed ? 'yarn install / npm install' : 'npm install'}`);
  console.log('  2. Edit architecture.config.json and docs/architecture/*.md');
  console.log('  3. Run: npm run architecture:validate');
  console.log('  4. Run: npm run architecture:doctor');
  if (options.embed === 'nextjs') {
    console.log('  5. Complete host setup: docs/architecture/_embed-host-setup.md');
    console.log('  6. npm run dev  →  http://localhost:3000/architecture/');
  } else {
    console.log('  5. Run: npx architecture-kit dev  (standalone docs site)');
  }
}
