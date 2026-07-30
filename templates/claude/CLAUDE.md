# {{projectName}} — Claude Code

This repo uses [@folklore-digital/architecture-kit](https://github.com/Folklore-Digital/architecture-kit) for repo-native architecture docs.

## Entrypoints

| Resource | Path |
|----------|------|
| AI context | `docs/architecture/ai-context.md` |
| Agent pack | `.architecture-kit/agent-pack.json` (after `scan` or site build) |
| Scan context | `.architecture-kit/agent-context.md` (from `npx architecture-kit scan`) |
| Skill | `.claude/skills/architecture-kit/SKILL.md` |

Use the **architecture-kit** skill for reading order, greenfield vs brownfield flows, and validation.

## Commands

```bash
npx architecture-kit scan              # → .architecture-kit/agent-context.md
npx architecture-kit bootstrap --apply # scaffold missing docs + merge config
npx architecture-kit validate          # links, mermaid, placeholders, integrations
npx architecture-kit doctor
npx architecture-kit mcp               # MCP stdio server (optional)
```

Run `validate` before opening PRs that change integrations, deployment, or folder structure. Significant decisions → ADR in `docs/adr/`.

See `AGENTS.md` for the same governance rules in a tool-neutral form.
