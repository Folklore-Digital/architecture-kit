import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ArchitectureConfig } from '../config/schema.js';
import {
  getRestrictedDeployPaths,
  resolveAgentOutputDir,
  resolveSiteExposure,
  resolveSiteMountPath,
  resolveSiteOutputDir,
} from '../config/sitePaths.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

const execFileAsync = promisify(execFile);

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' },
  {
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    label: 'Private key block',
  },
  {
    pattern: /(?:password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    label: 'Hardcoded credential assignment',
  },
];

const MIDDLEWARE_MARKERS = [
  'architecture-kit',
  'ARCHITECTURE_DOCS_PATH',
  'architecture docs exposure',
];

async function walkMarkdownFiles(
  dir: string,
  baseDir: string,
  files: string[] = [],
): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(full, baseDir, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }

  return files;
}

function fileMentionsAnyPattern(content: string, patterns: string[]): boolean {
  return patterns.some((pattern) => content.includes(pattern));
}

export async function validateDeployPaths(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const outputDir = resolveSiteOutputDir(config);
  const outputPath = path.join(cwd, outputDir);

  if (!(await pathExists(outputPath))) {
    return issues;
  }

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-files', '--', outputDir],
      { cwd },
    );
    const tracked = stdout
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (tracked.length > 0) {
      issues.push({
        level: 'warn',
        code: 'built-site-tracked-in-git',
        message: `Built architecture site is tracked in git (${tracked.length} file(s) under ${outputDir}) — add to .gitignore; source of truth is markdown in ${config.paths.docs}/`,
      });
    }
  } catch {
    // Not a git repo or git unavailable — skip
  }

  return issues;
}

export async function validateDeployExclusions(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const exposure = resolveSiteExposure(config);
  const outputDir = resolveSiteOutputDir(config);
  const agentOutput = resolveAgentOutputDir(config);
  const mountPath = resolveSiteMountPath(config).replace(/\/$/, '');

  if (exposure === 'production') {
    return issues;
  }

  const gitignorePath = path.join(cwd, '.gitignore');
  if (await pathExists(gitignorePath)) {
    const gitignore = await readFile(gitignorePath, 'utf-8');
    if (
      !fileMentionsAnyPattern(gitignore, [outputDir, `/${outputDir}`]) ||
      !fileMentionsAnyPattern(gitignore, [agentOutput, `/${agentOutput}`])
    ) {
      issues.push({
        level: 'warn',
        code: 'deploy-gitignore-incomplete',
        message: `site.exposure is "${exposure}" but .gitignore may not exclude ${outputDir} and ${agentOutput} — run init --embed or add manually`,
      });
    }
  }

  if (config.project.type === 'nextjs') {
    const vercelIgnorePath = path.join(cwd, '.vercelignore');
    if (await pathExists(vercelIgnorePath)) {
      const vercelIgnore = await readFile(vercelIgnorePath, 'utf-8');
      if (!fileMentionsAnyPattern(vercelIgnore, [outputDir])) {
        issues.push({
          level: 'warn',
          code: 'deploy-vercelignore-missing-output',
          message: `.vercelignore does not exclude ${outputDir} while site.exposure is "${exposure}"`,
        });
      }
    }

    const middlewareCandidates = [
      'middleware.ts',
      'middleware.js',
      'src/middleware.ts',
      'src/middleware.js',
    ];
    let hasMiddlewareGuard = false;
    for (const candidate of middlewareCandidates) {
      const middlewarePath = path.join(cwd, candidate);
      if (!(await pathExists(middlewarePath))) {
        continue;
      }
      const content = await readFile(middlewarePath, 'utf-8');
      if (
        MIDDLEWARE_MARKERS.some((marker) => content.includes(marker)) &&
        (content.includes(mountPath) || content.includes('architecture'))
      ) {
        hasMiddlewareGuard = true;
        break;
      }
    }

    const examplePath = path.join(cwd, 'middleware.architecture-docs.example.ts');
    if (!hasMiddlewareGuard && !(await pathExists(examplePath))) {
      issues.push({
        level: 'warn',
        code: 'deploy-missing-prod-guard',
        message: `No Next.js middleware guard for ${mountPath} while site.exposure is "${exposure}" — copy middleware.architecture-docs.example.ts from init --embed`,
      });
    } else if (!hasMiddlewareGuard && (await pathExists(examplePath))) {
      issues.push({
        level: 'warn',
        code: 'deploy-middleware-not-wired',
        message: `middleware.architecture-docs.example.ts exists but is not wired — merge into middleware.ts to block ${mountPath} in production`,
      });
    }
  }

  if (config.project.type.startsWith('wordpress')) {
    const distignorePath = path.join(cwd, '.distignore');
    if (!(await pathExists(distignorePath))) {
      issues.push({
        level: 'warn',
        code: 'deploy-missing-distignore',
        message:
          'WordPress project missing .distignore — copy templates/deploy/wordpress.distignore.example to exclude docs from theme deploys',
      });
    } else {
      const distignore = await readFile(distignorePath, 'utf-8');
      if (!fileMentionsAnyPattern(distignore, [config.paths.docs, outputDir])) {
        issues.push({
          level: 'warn',
          code: 'deploy-distignore-incomplete',
          message: `.distignore should exclude ${config.paths.docs}/ and ${outputDir} for WordPress deploy safety`,
        });
      }
    }
  }

  return issues;
}

export async function validateSecretsInDocs(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const archDir = path.join(cwd, config.paths.architectureDocs);

  if (!(await pathExists(archDir))) {
    return issues;
  }

  const files = await walkMarkdownFiles(archDir, cwd);
  for (const relPath of files) {
    const content = await readFile(path.join(cwd, relPath), 'utf-8');
    for (const { pattern, label } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        issues.push({
          level: 'error',
          code: 'doc-possible-secret',
          message: `Possible ${label} in ${relPath} — use placeholders and document keys in environments.md, not values`,
        });
        break;
      }
    }
  }

  return issues;
}

export async function validateDeployArtifact(
  artifactDir: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const restricted = getRestrictedDeployPaths(config);
  const exposure = resolveSiteExposure(config);
  const docsExposure = config.governance.docsProductionExposure ?? 'dev-only';

  const hits: string[] = [];
  for (const rel of restricted) {
    const target = path.join(artifactDir, rel);
    if (await pathExists(target)) {
      hits.push(rel);
    }
  }

  if (hits.length === 0) {
    return issues;
  }

  const level =
    exposure !== 'production' || docsExposure === 'none' ? 'error' : 'warn';

  issues.push({
    level,
    code: 'deploy-artifact-forbidden-paths',
    message: `Deploy artifact contains restricted architecture paths: ${hits.join(', ')} (site.exposure=${exposure}, docsProductionExposure=${docsExposure})`,
  });

  return issues;
}

export async function validateDeploySafety(
  cwd: string,
  config: ArchitectureConfig,
  options: { deployArtifact?: string } = {},
): Promise<ValidationIssue[]> {
  const issues = [
    ...(await validateDeployPaths(cwd, config)),
    ...(await validateDeployExclusions(cwd, config)),
    ...(await validateSecretsInDocs(cwd, config)),
  ];

  if (options.deployArtifact) {
    issues.push(
      ...(await validateDeployArtifact(
        path.resolve(cwd, options.deployArtifact),
        config,
      )),
    );
  }

  if (
    resolveSiteExposure(config) === 'production' &&
    config.governance.newEnvVarRequiresDocs
  ) {
    issues.push({
      level: 'warn',
      code: 'deploy-production-exposure',
      message:
        'site.exposure is "production" — confirm architecture docs should be public and contain no secrets',
    });
  }

  return issues;
}
