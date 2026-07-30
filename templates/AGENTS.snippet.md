## Architecture documentation

This project uses [@folklore-digital/architecture-kit](https://github.com/Folklore-Digital/architecture-kit).

- Read `docs/architecture/ai-context.md` before making structural changes
- After `scan` or site build: `.architecture-kit/agent-pack.json` (doc index + prompts)
- Run `npx architecture-kit validate` before opening a PR
- Update architecture docs in the same PR when changing integrations, deployment, or folder structure
- Significant decisions → add an ADR in `docs/adr/`
- Optional MCP: `npx architecture-kit mcp` (see `templates/mcp/cursor-mcp.json.example` in the kit repo)
