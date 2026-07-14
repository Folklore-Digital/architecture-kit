import { writeFile } from 'node:fs/promises';
import { CONFIG_FILENAME, loadConfig, tryLoadConfig } from '../config/loadConfig.js';
import { projectTypeLabels, type ProjectType } from '../config/schema.js';
import { detectProjectType } from '../detect/projectType.js';

export type DetectOptions = {
  cwd?: string;
  apply?: boolean;
};

export async function runDetect(options: DetectOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const detection = await detectProjectType(cwd);
  const loaded = await tryLoadConfig(cwd);

  console.log('Architecture Kit — Project Detection');
  console.log('====================================');
  console.log(
    `Suggested type: ${detection.suggested} (${projectTypeLabels[detection.suggested]})`,
  );
  console.log(`Confidence: ${detection.confidence}`);
  console.log('');

  if (detection.signals.length > 0) {
    console.log('Signals:');
    for (const signal of detection.signals) {
      if (signal.weight > 0) {
        console.log(`  - ${signal.label} (+${signal.weight})`);
      } else {
        console.log(`  - ${signal.label}`);
      }
    }
    console.log('');
  }

  if (loaded) {
    const current = loaded.config.project.type;
    if (current === detection.suggested) {
      console.log(`Config (${CONFIG_FILENAME}): type matches (${current})`);
    } else {
      console.log(
        `Config (${CONFIG_FILENAME}): type is "${current}", suggested "${detection.suggested}"`,
      );
      if (options.apply) {
        await applyProjectType(cwd, detection.suggested);
        console.log(`Updated ${CONFIG_FILENAME} project.type → ${detection.suggested}`);
      } else {
        console.log('Run with --apply to update project.type in config.');
      }
    }
  } else {
    console.log(`${CONFIG_FILENAME} not found.`);
    console.log(
      `Run: npx architecture-kit init --type ${detection.suggested}`,
    );
  }

  return 0;
}

async function applyProjectType(cwd: string, type: ProjectType): Promise<void> {
  const { config, configPath } = await loadConfig(cwd);
  config.project.type = type;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}
