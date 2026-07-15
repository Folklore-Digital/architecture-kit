import path from 'node:path';
import type { ProjectType } from '../config/schema.js';
import { projectTypeLabels } from '../config/schema.js';
import { scaffoldProject } from '../utils/fileSystem.js';

export type InitOptions = {
  type: ProjectType;
  name?: string;
  cwd?: string;
};

export async function runInit(options: InitOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const created = await scaffoldProject(cwd, options.type, options.name);

  console.log(`Initialized @folklore/architecture-kit (${projectTypeLabels[options.type]})`);
  console.log('');
  console.log('Created:');
  for (const item of created) {
    console.log(`  - ${item}`);
  }
  console.log('');
  console.log('Next steps:');
  console.log('  1. Edit architecture.config.json with your project details');
  console.log('  2. Fill in docs/architecture/*.md');
  console.log('  3. Run: npx architecture-kit validate');
  console.log('  4. Run: npx architecture-kit doctor');
  console.log('  5. Review .cursor/rules/architecture-kit.mdc and AGENTS.md');
}
