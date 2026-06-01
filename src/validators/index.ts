import type { ArchitectureConfig } from '../config/schema.js';
import { validateProject } from './base.js';
import type { ValidationResult } from './types.js';

export async function runValidation(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationResult> {
  return validateProject(cwd, config);
}
