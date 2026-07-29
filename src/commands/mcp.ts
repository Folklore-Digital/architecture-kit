import { startMcpServer } from '../mcp/startServer.js';

export type RunMcpOptions = {
  cwd?: string;
};

/** Start MCP server on stdio (for Claude Code, Cursor, etc.). */
export async function runMcp(options: RunMcpOptions = {}): Promise<number> {
  try {
    await startMcpServer({ cwd: options.cwd });
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
