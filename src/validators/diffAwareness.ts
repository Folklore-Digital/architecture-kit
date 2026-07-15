import { execSync } from 'node:child_process';
import type { ArchitectureConfig } from '../config/schema.js';
import type { ValidationIssue } from './types.js';

type DiffRule = {
  code: string;
  pattern: RegExp;
  docPaths: string[];
  message: string;
};

const DIFF_RULES: DiffRule[] = [
  {
    code: 'theme-change-without-docs',
    pattern: /^src\/theme\//,
    docPaths: ['docs/architecture/rendering-model.md', 'docs/adr/'],
    message:
      'Theme code changed — update docs/architecture/rendering-model.md or add an ADR',
  },
  {
    code: 'stages-change-without-docs',
    pattern: /^src\/stages\//,
    docPaths: ['docs/architecture/rendering-model.md', 'docs/architecture/project-structure.md', 'docs/adr/'],
    message:
      'Stage backgrounds changed — update rendering-model.md, project-structure.md, or an ADR',
  },
  {
    code: 'game-change-without-docs',
    pattern: /^src\/game\//,
    docPaths: ['docs/architecture/project-structure.md', 'docs/architecture/ai-context.md', 'docs/adr/'],
    message:
      'Game engine changed — update project-structure.md, ai-context.md, or an ADR',
  },
  {
    code: 'deps-change-without-docs',
    pattern: /^package\.json$/,
    docPaths: ['docs/architecture/integrations.md'],
    message:
      'package.json changed — update docs/architecture/integrations.md if dependencies changed',
  },
  {
    code: 'deploy-change-without-docs',
    pattern: /^(vercel\.json|next\.config\.(ts|js|mjs))$/,
    docPaths: ['docs/architecture/deployment.md', 'docs/architecture/environments.md'],
    message:
      'Deploy config changed — update deployment.md or environments.md',
  },
];

function gitChangedFiles(cwd: string, since: string): string[] {
  const attempts = [
    `git diff --name-only ${since}...HEAD`,
    `git diff --name-only ${since}`,
    `git diff --name-only HEAD~1`,
  ];

  for (const command of attempts) {
    try {
      const output = execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      const files = output.trim().split('\n').filter(Boolean);
      if (files.length > 0) {
        return files;
      }
    } catch {
      // try next
    }
  }

  return [];
}

function docTouched(changedFiles: string[], docPath: string): boolean {
  return changedFiles.some(
    (file) => file === docPath || file.startsWith(docPath),
  );
}

export async function validateDiffAwareness(
  cwd: string,
  _config: ArchitectureConfig,
  since: string,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const changedFiles = gitChangedFiles(cwd, since);

  if (changedFiles.length === 0) {
    return issues;
  }

  for (const rule of DIFF_RULES) {
    const codeChanged = changedFiles.some((file) => rule.pattern.test(file));
    if (!codeChanged) {
      continue;
    }

    const docsUpdated = rule.docPaths.some((docPath) =>
      docTouched(changedFiles, docPath),
    );

    if (!docsUpdated) {
      issues.push({
        level: 'warn',
        code: rule.code,
        message: rule.message,
      });
    }
  }

  return issues;
}
