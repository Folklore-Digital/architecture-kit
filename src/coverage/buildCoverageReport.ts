import { loadConfig } from '../config/loadConfig.js';
import type { ArchitectureConfig } from '../config/schema.js';
import { countAdrs, getArchitectureGaps } from '../mcp/gaps.js';
import type { ValidationIssue } from '../validators/types.js';
import { readKitVersion } from '../utils/fileSystem.js';

export type CoverageCategory =
  | 'integrations'
  | 'environment'
  | 'diagrams'
  | 'scaffold'
  | 'links'
  | 'ai-tooling'
  | 'structure'
  | 'other';

export type CoverageCategoryReport = {
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
};

export type ArchitectureCoverageReport = {
  schemaVersion: '1.0.0';
  generatedAt: string;
  kitVersion: string;
  project: {
    name: string;
    type: string;
    documentationStatus?: string;
  };
  summary: {
    docsHealthPercent: number;
    scaffoldFileCount: number;
    adrCount: number;
    integrationCount: number;
    errorCount: number;
    warningCount: number;
    passed: boolean;
  };
  categories: Record<CoverageCategory, CoverageCategoryReport>;
};

const CATEGORY_BY_CODE: Record<string, CoverageCategory> = {
  'missing-integrations-doc': 'integrations',
  'integration-not-documented': 'integrations',
  'integration-missing-adr': 'integrations',
  'env-var-not-documented': 'environment',
  'missing-diagram': 'diagrams',
  'empty-mermaid': 'diagrams',
  'mermaid-unknown-type': 'diagrams',
  'mermaid-unbalanced-brackets': 'diagrams',
  'mermaid-unbalanced-parens': 'diagrams',
  'mermaid-unbalanced-braces': 'diagrams',
  'scaffold-diagram-template': 'diagrams',
  'project-scaffold-mode': 'scaffold',
  'scaffold-doc-not-reviewed': 'scaffold',
  'placeholder-doc-content': 'scaffold',
  'active-with-scaffold-files': 'scaffold',
  'placeholder-config-content': 'scaffold',
  'broken-doc-link': 'links',
  'missing-cursor-rule': 'ai-tooling',
  'missing-agents-md': 'ai-tooling',
  'agents-missing-architecture-section': 'ai-tooling',
  'missing-claude-skill': 'ai-tooling',
  'built-site-tracked-in-git': 'other',
  'deploy-gitignore-incomplete': 'other',
  'deploy-vercelignore-missing-output': 'other',
  'deploy-missing-prod-guard': 'other',
  'deploy-middleware-not-wired': 'other',
  'deploy-missing-distignore': 'other',
  'deploy-distignore-incomplete': 'other',
  'deploy-artifact-forbidden-paths': 'other',
  'deploy-production-exposure': 'other',
  'doc-possible-secret': 'other',
  'missing-directory': 'structure',
  'missing-architecture-docs': 'structure',
  'missing-key-doc': 'structure',
  'missing-ai-context': 'structure',
  'missing-adr': 'structure',
};

function emptyCategories(): Record<CoverageCategory, CoverageCategoryReport> {
  return {
    integrations: { errors: 0, warnings: 0, issues: [] },
    environment: { errors: 0, warnings: 0, issues: [] },
    diagrams: { errors: 0, warnings: 0, issues: [] },
    scaffold: { errors: 0, warnings: 0, issues: [] },
    links: { errors: 0, warnings: 0, issues: [] },
    'ai-tooling': { errors: 0, warnings: 0, issues: [] },
    structure: { errors: 0, warnings: 0, issues: [] },
    other: { errors: 0, warnings: 0, issues: [] },
  };
}

function categorizeIssue(issue: ValidationIssue): CoverageCategory {
  return CATEGORY_BY_CODE[issue.code] ?? 'other';
}

function bucketIssues(
  issues: ValidationIssue[],
): Record<CoverageCategory, CoverageCategoryReport> {
  const categories = emptyCategories();

  for (const issue of issues) {
    const category = categorizeIssue(issue);
    categories[category].issues.push(issue);
    if (issue.level === 'error') {
      categories[category].errors += 1;
    } else {
      categories[category].warnings += 1;
    }
  }

  return categories;
}

export async function buildCoverageReport(
  cwd: string,
): Promise<ArchitectureCoverageReport> {
  const { config } = await loadConfig(cwd);
  const gaps = await getArchitectureGaps(cwd);
  const allIssues = [...gaps.errors, ...gaps.warnings];
  const adrCount = await countAdrs(cwd, config.paths.adr);
  const kitVersion = await readKitVersion();

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    kitVersion,
    project: {
      name: config.project.name,
      type: config.project.type,
      documentationStatus: config.project.documentationStatus,
    },
    summary: {
      docsHealthPercent: gaps.docsHealthPercent,
      scaffoldFileCount: gaps.scaffoldFileCount,
      adrCount,
      integrationCount: config.integrations.length,
      errorCount: gaps.errorCount,
      warningCount: gaps.warningCount,
      passed: gaps.passed,
    },
    categories: bucketIssues(allIssues),
  };
}

export function formatCoverageSummary(
  report: ArchitectureCoverageReport,
  config: ArchitectureConfig,
): string[] {
  const lines: string[] = [];
  lines.push('Coverage by category:');

  for (const [name, category] of Object.entries(report.categories)) {
    const total = category.errors + category.warnings;
    if (total === 0) {
      continue;
    }
    lines.push(
      `  ${name}: ${category.errors} error(s), ${category.warnings} warning(s)`,
    );
  }

  const configuredIntegrations = config.integrations.length;
  const integrationIssues = report.categories.integrations.issues.length;
  if (configuredIntegrations > 0) {
    lines.push(
      `  integrations coverage: ${configuredIntegrations - integrationIssues}/${configuredIntegrations} documented`,
    );
  }

  return lines;
}
