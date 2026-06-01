import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { integrationMentioned, pathExists } from '../utils/fileSystem.js';
import {
  createResult,
  type ValidationIssue,
  type ValidationResult,
} from './types.js';

const REQUIRED_DIAGRAMS = ['system-overview.mmd'];

export async function validateBase(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const { paths } = config;

  const requiredDirs = [
    paths.docs,
    paths.architectureDocs,
    paths.adr,
    paths.diagrams,
  ];

  for (const dir of requiredDirs) {
    const fullPath = path.join(cwd, dir);
    if (!(await pathExists(fullPath))) {
      issues.push({
        level: 'error',
        code: 'missing-directory',
        message: `Required directory missing: ${dir}`,
      });
    }
  }

  const architectureDir = path.join(cwd, paths.architectureDocs);
  if (await pathExists(architectureDir)) {
    const files = await readdir(architectureDir);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      issues.push({
        level: 'error',
        code: 'missing-architecture-docs',
        message: `No architecture markdown files found in ${paths.architectureDocs}`,
      });
    }

    const aiContextPath = path.join(cwd, paths.aiContext);
    if (!(await pathExists(aiContextPath))) {
      issues.push({
        level: 'error',
        code: 'missing-ai-context',
        message: `AI context file missing: ${paths.aiContext}`,
      });
    }
  }

  const adrDir = path.join(cwd, paths.adr);
  if (await pathExists(adrDir)) {
    const adrFiles = (await readdir(adrDir)).filter((file) =>
      file.endsWith('.md'),
    );
    if (adrFiles.length === 0) {
      issues.push({
        level: 'warn',
        code: 'missing-adr',
        message: `No ADR files found in ${paths.adr}`,
      });
    }
  }

  const diagramsDir = path.join(cwd, paths.diagrams);
  if (await pathExists(diagramsDir)) {
    for (const diagram of REQUIRED_DIAGRAMS) {
      const diagramPath = path.join(diagramsDir, diagram);
      if (!(await pathExists(diagramPath))) {
        issues.push({
          level: 'warn',
          code: 'missing-diagram',
          message: `Recommended diagram missing: ${paths.diagrams}/${diagram}`,
        });
      }
    }
  }

  const integrationsPath = path.join(cwd, paths.architectureDocs, 'integrations.md');
  if (config.integrations.length > 0) {
    if (!(await pathExists(integrationsPath))) {
      issues.push({
        level: 'error',
        code: 'missing-integrations-doc',
        message: `integrations.md missing at ${paths.architectureDocs}/integrations.md`,
      });
    } else {
      const integrationsMarkdown = await readFile(integrationsPath, 'utf-8');
      for (const integration of config.integrations) {
        if (!integrationMentioned(integrationsMarkdown, integration.name)) {
          issues.push({
            level: 'error',
            code: 'integration-not-documented',
            message: `Integration "${integration.name}" listed in config but not found in integrations.md`,
          });
        }
      }
    }
  }

  return createResult(issues);
}

export async function validateProject(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationResult> {
  return validateBase(cwd, config);
}
