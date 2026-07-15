import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { integrationMentioned, pathExists } from '../utils/fileSystem.js';
import {
  createResult,
  type ValidationIssue,
  type ValidationResult,
} from './types.js';

const REQUIRED_DIAGRAMS = ['system-overview.mmd', 'data-flow.mmd'];

const REQUIRED_KEY_DOCS = ['overview.md', 'deployment.md'];

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

    for (const doc of REQUIRED_KEY_DOCS) {
      const docPath = path.join(architectureDir, doc);
      if (!(await pathExists(docPath))) {
        issues.push({
          level: 'warn',
          code: 'missing-key-doc',
          message: `Recommended architecture doc missing: ${paths.architectureDocs}/${doc}`,
        });
      }
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

  if (
    config.governance.newIntegrationRequiresAdr &&
    config.integrations.length > 0 &&
    (await pathExists(adrDir))
  ) {
    const adrFiles = (await readdir(adrDir)).filter((file) =>
      file.endsWith('.md'),
    );
    const adrContents = await Promise.all(
      adrFiles.map((file) => readFile(path.join(adrDir, file), 'utf-8')),
    );
    const allAdrText = adrContents.join('\n');

    for (const integration of config.integrations) {
      if (!integrationMentioned(allAdrText, integration.name)) {
        issues.push({
          level: 'warn',
          code: 'integration-missing-adr',
          message: `Integration "${integration.name}" has no ADR mention (governance: newIntegrationRequiresAdr)`,
        });
      }
    }
  }

  if (config.governance.newEnvVarRequiresDocs) {
    const envExamplePath = path.join(cwd, '.env.example');
    const environmentsPath = path.join(
      cwd,
      paths.architectureDocs,
      'environments.md',
    );

    if (
      (await pathExists(envExamplePath)) &&
      (await pathExists(environmentsPath))
    ) {
      const envExample = await readFile(envExamplePath, 'utf-8');
      const environmentsMarkdown = await readFile(environmentsPath, 'utf-8');
      const envKeys = [...envExample.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)].map(
        (match) => match[1],
      );

      for (const key of envKeys) {
        if (!environmentsMarkdown.includes(key)) {
          issues.push({
            level: 'warn',
            code: 'env-var-not-documented',
            message: `Environment variable "${key}" in .env.example but not mentioned in environments.md`,
          });
        }
      }
    }
  }

  return createResult(issues);
}
