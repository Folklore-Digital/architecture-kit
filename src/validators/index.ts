import type { ArchitectureConfig } from '../config/schema.js';
import { validateBase } from './base.js';
import { validateDiffAwareness } from './diffAwareness.js';
import { validateLinks } from './links.js';
import { validateMermaid } from './mermaid.js';
import { validatePlaceholders } from './placeholders.js';
import { validateAiTooling } from './aiTooling.js';
import { validateStorybook } from './storybook.js';
import { createResult, mergeResults, type ValidationResult } from './types.js';

export type ValidateOptions = {
  since?: string;
  ci?: boolean;
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
  const placeholderIssues = await validatePlaceholders(cwd, config, {
    ci: options.ci,
  });
  const aiTooling = await validateAiTooling(cwd, config);
  const linkIssues = await validateLinks(cwd, config);
  const mermaidIssues = await validateMermaid(cwd, config);
  const storybookIssues = await validateStorybook(cwd, config);
  const diffIssues = options.since
    ? await validateDiffAwareness(cwd, config, options.since)
    : [];

  return mergeResults(
    base,
    createResult(placeholderIssues),
    createResult(aiTooling),
    createResult(linkIssues),
    createResult(mermaidIssues),
    createResult(storybookIssues),
    createResult(diffIssues),
  );
}
