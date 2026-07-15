import type { ArchitectureConfig } from '../config/schema.js';
import { validateBase } from './base.js';
import { validateDiffAwareness } from './diffAwareness.js';
import { validatePlaceholders } from './placeholders.js';
import { validateAiTooling } from './aiTooling.js';
import { createResult, mergeResults, type ValidationResult } from './types.js';

export type ValidateOptions = {
  since?: string;
};

export async function runValidation(
  cwd: string,
  config: ArchitectureConfig,
  options: ValidateOptions = {},
): Promise<ValidationResult> {
  return validateProject(cwd, config, options);
}

export async function validateProject(
  cwd: string,
  config: ArchitectureConfig,
  options: ValidateOptions = {},
): Promise<ValidationResult> {
  const base = await validateBase(cwd, config);
  const placeholderIssues = await validatePlaceholders(cwd, config);
  const aiTooling = await validateAiTooling(cwd, config);
  const diffIssues = options.since
    ? await validateDiffAwareness(cwd, config, options.since)
    : [];

  return mergeResults(
    base,
    createResult(placeholderIssues),
    createResult(aiTooling),
    createResult(diffIssues),
  );
}
