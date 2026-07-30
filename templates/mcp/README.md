# Architecture Kit MCP server

Stdio MCP server for **repo-native** architecture docs. Reads markdown and config from the host repo on disk — not a hosted wiki.

## Start the server

```bash
npx architecture-kit mcp
```

Run from the **host repo root** (where `architecture.config.json` lives).

## Cursor configuration

Copy into Cursor MCP settings (or merge with your config):

```json
{
  "mcpServers": {
    "architecture-kit": {
      "command": "npx",
      "args": ["architecture-kit", "mcp"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

See [cursor-mcp.json.example](./cursor-mcp.json.example).

**Local kit development:** point `command` at `node` and `args` at `../architecture-kit/dist/cli.js mcp`, or use `ARCHITECTURE_KIT_LOCAL=1` with host embed scripts.

## Claude Code

Same command — add to Claude Code MCP config with the project root as working directory. Prefer MCP tools over pasted context when the skill references them (`.claude/skills/architecture-kit/SKILL.md`).

## Recommended agent workflow

1. **`architecture_get_context`** — entrypoints, `ai-context.md`, agent-pack index
2. **`architecture_search`** or **`architecture_list_pages`** — find the right page
3. **`architecture_get_page`** — read full markdown for one doc
4. Before finishing doc-related work: **`architecture_list_gaps`** or **`architecture_validate`**

## Tools

| Tool | Purpose | Key inputs |
|------|---------|------------|
| `architecture_get_context` | Project summary, paths, governance, `ai-context` text, agent-pack metadata | (none) |
| `architecture_search` | Keyword search over `search-index.json` or live doc scan | `query`, optional `limit` (1–25) |
| `architecture_get_page` | Read one doc by path | `path` (e.g. `docs/architecture/overview.md`) |
| `architecture_list_pages` | List all architecture pages with scaffold flags | (none) |
| `architecture_list_gaps` | Docs health: scaffold count, errors/warnings | (none) |
| `architecture_validate` | Full validate (integrations, links, deploy safety, secrets) | optional `ci`, `since` |

All tools return JSON as text in the MCP response.

## Data sources

| Source | When used |
|--------|-----------|
| `architecture.config.json` | Project type, paths, governance, `site.exposure` |
| `docs/architecture/ai-context.md` | Human + agent entrypoint |
| `.architecture-kit/agent-pack.json` | Doc index (after `scan` or site build) |
| `.architecture-kit/search-index.json` | Fast search (after site build) |
| `.architecture-kit/embed-manifest.json` | Mount path / output dir for embed hosts |

## Non-goals

- **No write tools** — docs change in git via PR, not via MCP
- **No hosted SaaS** — server reads local files only
- **Not a replacement for `validate` in CI** — use `npm run architecture:validate -- --ci` in pipelines

## Manual smoke test (no IDE)

Handler-level tests live in `tests/mcp.test.ts`. From a scaffolded repo:

```bash
npx architecture-kit scan
npx architecture-kit build --out .architecture-kit/site
# Configure MCP in Cursor, then ask:
# "Use architecture_get_context and tell me the project type"
# "Search architecture docs for deployment"
# "Run architecture_validate with ci true"
```
