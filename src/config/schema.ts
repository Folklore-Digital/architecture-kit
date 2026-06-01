import { z } from 'zod';

export const SCHEMA_VERSION = '0.1.0';

export const integrationSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(true),
  docs: z.string().min(1),
  owner: z.string().optional(),
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
    })
    .default({}),
  paths: z
    .object({
      docs: z.string().default('docs'),
      architectureDocs: z.string().default('docs/architecture'),
      adr: z.string().default('docs/adr'),
      diagrams: z.string().default('docs/diagrams'),
      aiContext: z.string().default('docs/architecture/ai-context.md'),
    })
    .default({}),
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
    },
    paths: {
      docs: 'docs',
      architectureDocs: 'docs/architecture',
      adr: 'docs/adr',
      diagrams: 'docs/diagrams',
      aiContext: 'docs/architecture/ai-context.md',
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
