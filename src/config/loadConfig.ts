import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  architectureConfigSchema,
  type ArchitectureConfig,
} from './schema.js';

export const CONFIG_FILENAME = 'architecture.config.json';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export async function loadConfig(
  cwd: string = process.cwd(),
): Promise<{ config: ArchitectureConfig; configPath: string }> {
  const configPath = path.join(cwd, CONFIG_FILENAME);

  let raw: string;
  try {
    raw = await readFile(configPath, 'utf-8');
  } catch {
    throw new ConfigError(
      `${CONFIG_FILENAME} not found. Run \`npx architecture-kit init\` first.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(`${CONFIG_FILENAME} is not valid JSON.`);
  }

  const result = architectureConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(`Invalid ${CONFIG_FILENAME}:\n${issues}`);
  }

  return { config: result.data, configPath };
}

export async function tryLoadConfig(
  cwd: string = process.cwd(),
): Promise<{ config: ArchitectureConfig; configPath: string } | null> {
  try {
    return await loadConfig(cwd);
  } catch {
    return null;
  }
}
