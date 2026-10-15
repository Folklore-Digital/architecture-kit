import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_AI_ADAPTERS,
  hasAiAdapter,
  type AiAdapter,
} from '../agent/adapters.js';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

function resolveAdapters(config: ArchitectureConfig): AiAdapter[] {
  const configured = config.ai?.adapters;
  return configured?.length ? configured : [...DEFAULT_AI_ADAPTERS];
}

export async function validateAiTooling(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const adapters = resolveAdapters(config);
  const cursorRulePath = path.join(cwd, '.cursor/rules/architecture-kit.mdc');
  const agentsPath = path.join(cwd, 'AGENTS.md');
  const claudePath = path.join(cwd, 'CLAUDE.md');
  const claudeSkillPath = path.join(
    cwd,
    '.claude/skills/architecture-kit/SKILL.md',
  );
  const aiContextRelative = config.paths.aiContext.replace(/\\/g, '/');

  const hasAgents = await pathExists(agentsPath);
  const hasClaude = await pathExists(claudePath);
  const hasCursorRule = await pathExists(cursorRulePath);

  if (hasAiAdapter(adapters, 'cursor') && !hasCursorRule) {
    issues.push({
      level: 'warn',
      code: 'missing-cursor-rule',
      message:
        'ai.adapters includes "cursor" but .cursor/rules/architecture-kit.mdc is missing — run init --adapters agents,cursor or copy templates/cursor/',
    });
  }

  if (hasAiAdapter(adapters, 'agents')) {
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
    } else if (!hasCursorRule && !hasClaude) {
      issues.push({
        level: 'warn',
        code: 'missing-agents-md',
        message:
          'AGENTS.md missing — create one or append templates/AGENTS.snippet.md from architecture-kit',
      });
    }
  }

  if (hasAiAdapter(adapters, 'claude')) {
    if (hasClaude) {
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
            'CLAUDE.md exists but does not reference architecture docs — point it at AGENTS.md or ai-context.md',
        });
      }

      if (!(await pathExists(claudeSkillPath))) {
        issues.push({
          level: 'warn',
          code: 'missing-claude-skill',
          message:
            'ai.adapters includes "claude" but .claude/skills/architecture-kit/SKILL.md is missing — run init --adapters agents,claude or copy templates/claude/',
        });
      }
    } else {
      issues.push({
        level: 'warn',
        code: 'missing-claude-skill',
        message:
          'ai.adapters includes "claude" but CLAUDE.md / skill are missing — run init --adapters agents,claude',
      });
    }
  }

  return issues;
}
