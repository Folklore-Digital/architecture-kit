import type { ArchitectureConfig } from '../config/schema.js';
import { validateBase } from './base.js';
import { validatePlaceholders } from './placeholders.js';
import { createResult, mergeResults, type ValidationResult } from './types.js';

export async function runValidation(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationResult> {
  return validateProject(cwd, config);
}

export async function validateProject(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationResult> {
  const base = await validateBase(cwd, config);
  const placeholderIssues = await validatePlaceholders(cwd, config);
  return mergeResults(base, createResult(placeholderIssues));
}
