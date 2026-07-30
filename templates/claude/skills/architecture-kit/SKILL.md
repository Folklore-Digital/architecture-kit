---
name: architecture-kit
description: >-
  Read and update repo-native architecture documentation. Use when changing
  integrations, deployment, folder structure, filling scaffold docs, or before
  PRs that affect system design.
---

# Architecture Kit

## When to use

- Structural, integration, or deployment changes
- Filling scaffold documentation after `init` or `bootstrap`
- Before merge when architecture docs may be stale

## Reading order

1. `docs/architecture/ai-context.md`
2. Relevant page from `.architecture-kit/agent-pack.json` (`docs` index) or `documentation-map.md`
3. Source code for the area you are changing

Prefer MCP tools when configured: `architecture_get_context` → `architecture_search` / `architecture_get_page`.

## Greenfield (scaffold mode)

When docs have `status: scaffold` frontmatter or `documentationStatus` is not `"active"`:

1. Run `npx architecture-kit scan`
2. Follow `.architecture-kit/prompts/greenfield.md`
3. Remove scaffold frontmatter from each reviewed file
4. Set `project.documentationStatus` to `"active"` only after content is project-specific
5. Run `npx architecture-kit validate`

## Brownfield (active docs)

When changing existing code, follow `.architecture-kit/prompts/brownfield-doc-update.md`:

- Integrations → `integrations.md` (+ ADR if required)
- Env vars → `environments.md`
- Deployment / build → `deployment.md`
- Folder boundaries → `project-structure.md`, `ai-context.md`
- System shape → update `docs/diagrams/*.mmd` and link from overview

## Validation

Before finishing doc-related tasks:

```bash
npx architecture-kit validate
npx architecture-kit doctor
```

Use `validate --ci` before merge. Fix errors; treat warnings seriously in CI mode.

## Scope

- Kit/template/validator changes → **architecture-kit** repo (release new version)
- Application code and project docs → **this repo**
- Say explicitly when a task is docs-only vs code-only
