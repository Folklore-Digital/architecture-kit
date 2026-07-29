import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readKitVersion } from '../utils/fileSystem.js';
import {
  getArchitectureContext,
  getArchitecturePage,
  listArchitecturePages,
  searchArchitectureDocs,
} from './handlers.js';
import { getArchitectureGaps, runArchitectureValidation } from './gaps.js';

function textResult(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export type StartMcpServerOptions = {
  cwd?: string;
  kitVersion?: string;
};

export async function startMcpServer(
  options: StartMcpServerOptions = {},
): Promise<McpServer> {
  const cwd = options.cwd ?? process.cwd();
  const kitVersion = options.kitVersion ?? (await readKitVersion());

  const server = new McpServer(
    {
      name: 'architecture-kit',
      version: kitVersion,
    },
    {
      instructions: [
        'Architecture Kit MCP — repo-native system architecture docs.',
        'Start with architecture_get_context, then architecture_search or architecture_get_page.',
        'Use architecture_list_gaps or architecture_validate before finishing doc-related tasks.',
        `Working directory: ${cwd}`,
      ].join('\n'),
    },
  );

  server.registerTool(
    'architecture_get_context',
    {
      description:
        'Project architecture entrypoints: ai-context.md, agent-context.md, config summary, and agent-pack metadata.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return textResult(await getArchitectureContext(cwd));
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  server.registerTool(
    'architecture_search',
    {
      description:
        'Keyword search over architecture docs (search-index.json or live scan of docs/).',
      inputSchema: z.object({
        query: z.string().min(1).describe('Search terms'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(25)
          .optional()
          .describe('Max results (default 10)'),
      }),
    },
    async ({ query, limit }) => {
      try {
        const results = await searchArchitectureDocs(cwd, query, limit ?? 10);
        return textResult({ query, count: results.length, results });
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  server.registerTool(
    'architecture_get_page',
    {
      description:
        'Read one architecture doc by path (e.g. docs/architecture/overview.md or architecture/overview.md).',
      inputSchema: z.object({
        path: z.string().min(1).describe('Doc path relative to repo or docs root'),
      }),
    },
    async ({ path: docPath }) => {
      try {
        const page = await getArchitecturePage(cwd, docPath);
        if (!page) {
          return errorResult(`Page not found: ${docPath}`);
        }
        return textResult(page);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  server.registerTool(
    'architecture_list_pages',
    {
      description: 'List all architecture markdown and mermaid pages in the docs tree.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const pages = await listArchitecturePages(cwd);
        return textResult({ count: pages.length, pages });
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  server.registerTool(
    'architecture_list_gaps',
    {
      description:
        'Docs health report: validation errors/warnings, scaffold file count, documentationStatus.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return textResult(await getArchitectureGaps(cwd));
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  server.registerTool(
    'architecture_validate',
    {
      description:
        'Run full architecture-kit validate and return structured issues (integrations, links, scaffold, placeholders).',
      inputSchema: z.object({
        ci: z
          .boolean()
          .optional()
          .describe('When true, treat warnings as failures (CI mode)'),
        since: z
          .string()
          .optional()
          .describe('Git ref for diff-aware checks (e.g. origin/develop)'),
      }),
    },
    async ({ ci, since }) => {
      try {
        return textResult(await runArchitectureValidation(cwd, { ci, since }));
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}
