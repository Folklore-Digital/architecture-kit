import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import type { ValidationIssue } from './types.js';

const DIAGRAM_TYPES =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)/im;

function validateMermaidSyntax(
  content: string,
  relPath: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const trimmed = content.trim();

  if (!trimmed) {
    issues.push({
      level: 'error',
      code: 'empty-mermaid',
      message: `Empty Mermaid diagram: ${relPath}`,
    });
    return issues;
  }

  if (!DIAGRAM_TYPES.test(trimmed)) {
    issues.push({
      level: 'warn',
      code: 'mermaid-unknown-type',
      message: `Mermaid file may be missing a diagram declaration: ${relPath}`,
    });
  }

  const openBrackets = (trimmed.match(/\[/g) ?? []).length;
  const closeBrackets = (trimmed.match(/\]/g) ?? []).length;
  if (openBrackets !== closeBrackets) {
    issues.push({
      level: 'error',
      code: 'mermaid-unbalanced-brackets',
      message: `Unbalanced square brackets in ${relPath} (${openBrackets} [ vs ${closeBrackets} ])`,
    });
  }

  const openParens = (trimmed.match(/\(/g) ?? []).length;
  const closeParens = (trimmed.match(/\)/g) ?? []).length;
  if (openParens !== closeParens) {
    issues.push({
      level: 'error',
      code: 'mermaid-unbalanced-parens',
      message: `Unbalanced parentheses in ${relPath}`,
    });
  }

  const openBraces = (trimmed.match(/\{/g) ?? []).length;
  const closeBraces = (trimmed.match(/\}/g) ?? []).length;
  if (openBraces !== closeBraces) {
    issues.push({
      level: 'error',
      code: 'mermaid-unbalanced-braces',
      message: `Unbalanced curly braces in ${relPath}`,
    });
  }

  return issues;
}

async function walkMermaid(
  dir: string,
  files: string[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMermaid(fullPath, files);
    } else if (entry.name.endsWith('.mmd')) {
      files.push(fullPath);
    }
  }
}

export async function validateMermaid(
  cwd: string,
  config: ArchitectureConfig,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const diagramsDir = path.join(cwd, config.paths.diagrams);

  if (!(await pathExists(diagramsDir))) {
    return issues;
  }

  const mmdFiles: string[] = [];
  await walkMermaid(diagramsDir, mmdFiles);

  for (const filePath of mmdFiles) {
    const content = await readFile(filePath, 'utf-8');
    const relPath = path.relative(cwd, filePath).replace(/\\/g, '/');
    issues.push(...validateMermaidSyntax(content, relPath));
  }

  return issues;
}
