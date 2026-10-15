import { z } from 'zod';
import {
  AI_ADAPTERS,
  DEFAULT_AI_ADAPTERS,
} from '../agent/adapters.js';

export const SCHEMA_VERSION = '0.1.0';

export const aiAdapterSchema = z.enum(AI_ADAPTERS);

export const aiSchema = z.object({
  /**
   * Which AI entrypoint adapters to scaffold / validate.
   * Default `["agents"]` — tool-agnostic AGENTS.md only.
   * Add `cursor` and/or `claude` to opt into vendor-specific files.
   */
  adapters: z.array(aiAdapterSchema).default([...DEFAULT_AI_ADAPTERS]),
});

export const integrationSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(true),
  docs: z.string().min(1),
  owner: z.string().optional(),
});

/** Optional Storybook integration — only enable when the project uses Storybook. */
export const storybookSchema = z.object({
  enabled: z.boolean().default(false),
  /** Public URL when deployed, or local dev URL (e.g. http://localhost:6006). */
  url: z.string().url().optional(),
  /** Path to Storybook docs or README in the repo, for validation cross-links. */
  docsPath: z.string().optional(),
});

export const siteSchema = z.object({
  /** Show last-updated / last-reviewed dates on doc pages. Default true. */
  showDates: z.boolean().default(true),
  /** Prefer git commit date for "last updated"; fall back to file mtime. */
  dateSource: z.enum(['git', 'file']).default('git'),
  /** Public URL path when embedded in a host app (Next.js redirect + link rewrite). */
  mountPath: z.string().default('/architecture/'),
  /** Host-app directory for built static HTML (relative to repo root). */
  outputDir: z.string().default('public/architecture'),
  /**
   * Where built architecture docs may be exposed:
   * - local: dev machine only (standalone `architecture-kit dev`)
   * - dev-staging: internal dev/staging hosts (default for Next.js embed)
   * - production: intentionally public on production deploys
   */
  exposure: z
    .enum(['local', 'dev-staging', 'production'])
    .default('dev-staging'),
  /** Override architecture sidebar groups (optional). */
  navGroups: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        files: z.array(z.string()).default([]),
      }),
    )
    .optional(),
});

export const architectureConfigSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  project: z.object({
    name: z.string().min(1),
    type: z.enum([
      'nextjs',
      'wordpress-custom',
      'wordpress-builder',
      'craft',
      'generic',
    ]),
    description: z.string().optional(),
    owners: z.array(z.string()).default([]),
    /** scaffold = generic init templates; active = reviewed project docs */
    documentationStatus: z.enum(['scaffold', 'active']).optional(),
  }),
  stack: z.object({
    frontend: z.string().nullable().optional(),
    backend: z.string().nullable().optional(),
    cms: z.string().nullable().optional(),
    database: z.string().nullable().optional(),
    hosting: z.string().nullable().optional(),
    packageManager: z.string().nullable().optional(),
  }),
  architecture: z
    .object({
      renderingModel: z.array(z.string()).default([]),
      dataSources: z.array(z.string()).default([]),
      deploymentTargets: z.array(z.string()).default([]),
    })
    .default({}),
  integrations: z.array(integrationSchema).default([]),
  governance: z
    .object({
      newIntegrationRequiresDocs: z.boolean().default(true),
      newIntegrationRequiresAdr: z.boolean().default(true),
      newEnvVarRequiresDocs: z.boolean().default(true),
      newExternalScriptRequiresDocs: z.boolean().default(true),
      newClientComponentRequiresReason: z.boolean().default(false),
      newPackageRequiresReview: z.boolean().default(false),
      /** When true, validate --ci fails on scaffold frontmatter / placeholder content */
      scaffoldBlocksCi: z.boolean().default(true),
      /**
       * Whether markdown sources may ship to production (built HTML uses site.exposure).
       * none = keep docs out of production deploy artifacts; dev-only = internal hosts; public = ok on prod.
       */
      docsProductionExposure: z
        .enum(['none', 'dev-only', 'public'])
        .default('dev-only'),
    })
    .default({}),
  paths: z
    .object({
      docs: z.string().default('docs'),
      architectureDocs: z.string().default('docs/architecture'),
      adr: z.string().default('docs/adr'),
      diagrams: z.string().default('docs/diagrams'),
      aiContext: z.string().default('docs/architecture/ai-context.md'),
      /** Generated agent artifacts (agent-pack, prompts, embed manifest). */
      agentOutput: z.string().default('.architecture-kit'),
    })
    .default({}),
  /** Optional — set when the project uses Storybook for UI documentation. */
  storybook: storybookSchema.optional(),
  /**
   * AI entrypoints. Default is tool-agnostic (`agents` → AGENTS.md).
   * Opt into Cursor/Claude files via adapters or `init --adapters …`.
   */
  ai: aiSchema.optional(),
  /** Docs site presentation options. */
  site: siteSchema.optional(),
});

export type ArchitectureConfig = z.infer<typeof architectureConfigSchema>;
export type ProjectType = ArchitectureConfig['project']['type'];

export const projectTypeLabels: Record<ProjectType, string> = {
  nextjs: 'Next.js',
  'wordpress-custom': 'WordPress Custom Theme',
  'wordpress-builder': 'WordPress Builder-Based',
  craft: 'Craft CMS',
  generic: 'Generic',
};

export function createDefaultConfig(
  type: ProjectType,
  projectName = 'Project Name',
): ArchitectureConfig {
  const base: ArchitectureConfig = {
    schemaVersion: SCHEMA_VERSION,
    project: {
      name: projectName,
      type,
      description: 'Short project description',
      owners: [],
      documentationStatus: 'scaffold',
    },
    stack: {
      frontend: null,
      backend: null,
      cms: null,
      database: null,
      hosting: null,
      packageManager: 'pnpm',
    },
    architecture: {
      renderingModel: [],
      dataSources: [],
      deploymentTargets: ['test', 'stage', 'production'],
    },
    integrations: [],
    governance: {
      newIntegrationRequiresDocs: true,
      newIntegrationRequiresAdr: true,
      newEnvVarRequiresDocs: true,
      newExternalScriptRequiresDocs: true,
      newClientComponentRequiresReason: false,
      newPackageRequiresReview: false,
      scaffoldBlocksCi: true,
      docsProductionExposure: 'dev-only',
    },
    paths: {
      docs: 'docs',
      architectureDocs: 'docs/architecture',
      adr: 'docs/adr',
      diagrams: 'docs/diagrams',
      aiContext: 'docs/architecture/ai-context.md',
      agentOutput: '.architecture-kit',
    },
    ai: {
      adapters: [...DEFAULT_AI_ADAPTERS],
    },
    site: {
      showDates: true,
      dateSource: 'git',
      mountPath: '/architecture/',
      outputDir: 'public/architecture',
      exposure: 'dev-staging',
    },
  };

  switch (type) {
    case 'nextjs':
      return {
        ...base,
        stack: {
          ...base.stack,
          frontend: 'Next.js App Router',
          packageManager: 'pnpm',
        },
        architecture: {
          renderingModel: [
            'server-components',
            'client-components',
            'static-generation',
          ],
          dataSources: ['Environment Variables'],
          deploymentTargets: ['test', 'stage', 'preview', 'production'],
        },
      };
    case 'wordpress-custom':
      return {
        ...base,
        stack: {
          ...base.stack,
          frontend: 'Custom WordPress Theme',
          cms: 'WordPress',
        },
      };
    case 'wordpress-builder':
      return {
        ...base,
        stack: {
          ...base.stack,
          frontend: 'WordPress Builder',
          cms: 'WordPress',
        },
      };
    case 'craft':
      return {
        ...base,
        stack: {
          ...base.stack,
          frontend: 'Twig Templates',
          cms: 'Craft CMS',
        },
      };
    default:
      return base;
  }
}
