import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

export async function validateAiTooling(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const cursorRulePath = path.join(cwd, '.cursor/rules/architecture-kit.mdc');
  const agentsPath = path.join(cwd, 'AGENTS.md');
  const claudePath = path.join(cwd, 'CLAUDE.md');

  if (!(await pathExists(cursorRulePath))) {
    issues.push({
      level: 'warn',
      code: 'missing-cursor-rule',
      message:
        'Missing .cursor/rules/architecture-kit.mdc — run init or copy from architecture-kit templates/cursor/',
    });
  }

  const hasAgents = await pathExists(agentsPath);
  const hasClaude = await pathExists(claudePath);
  const aiContextRelative = config.paths.aiContext.replace(/\\/g, '/');

  if (hasAgents) {
    const agentsContent = await readFile(agentsPath, 'utf-8');
    const mentionsKit =
      agentsContent.includes('architecture-kit') ||
      agentsContent.includes(aiContextRelative);

    if (!mentionsKit) {
      issues.push({
        level: 'warn',
        code: 'agents-missing-architecture-section',
        message:
          'AGENTS.md exists but does not mention architecture-kit or ai-context — append templates/AGENTS.snippet.md',
      });
    }
  } else if (hasClaude) {
    const claudeContent = await readFile(claudePath, 'utf-8');
    const mentionsKit =
      claudeContent.includes('architecture-kit') ||
      claudeContent.includes(aiContextRelative) ||
      claudeContent.includes('AGENTS.md');

    if (!mentionsKit) {
      issues.push({
        level: 'warn',
        code: 'agents-missing-architecture-section',
        message:
          'CLAUDE.md exists but does not reference architecture docs — add AGENTS.md or append templates/AGENTS.snippet.md',
      });
    }
  } else if (!(await pathExists(cursorRulePath))) {
    issues.push({
      level: 'warn',
      code: 'missing-agents-md',
      message:
        'AGENTS.md missing — create one or append templates/AGENTS.snippet.md from architecture-kit',
    });
  }

  return issues;
}
