import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArchitectureConfig } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';
import { stripFrontmatter } from '../utils/scaffoldFrontmatter.js';
import type { ValidationIssue } from './types.js';

const DIAGRAM_TYPES =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)/im;

/** Generic nextjs template diagram nodes — warn when still present after bootstrap. */
const TEMPLATE_DIAGRAM_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /CMS\s+as\s+Content\s+Source/i, label: 'CMS as Content Source' },
  { pattern: /\bCMS\b.*Content/i, label: 'CMS content placeholder' },
  { pattern: /-->\s*CMS\b/, label: 'CMS integration node' },
  { pattern: /-->\s*Analytics\b/, label: 'Analytics placeholder node' },
  { pattern: /Analytics\s+Provider/i, label: 'Analytics Provider placeholder' },
];

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

function validateTemplateDiagramContent(
  content: string,
  relPath: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const { pattern, label } of TEMPLATE_DIAGRAM_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        level: 'warn',
        code: 'scaffold-diagram-template',
        message: `Diagram still contains template placeholder "${label}": ${relPath}`,
      });
    }
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
    const raw = await readFile(filePath, 'utf-8');
    const content = stripFrontmatter(raw);
    const relPath = path.relative(cwd, filePath).replace(/\\/g, '/');
    issues.push(...validateMermaidSyntax(content, relPath));
    issues.push(...validateTemplateDiagramContent(content, relPath));
  }

  return issues;
}
