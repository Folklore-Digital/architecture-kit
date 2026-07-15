# Documentation Map

## Purpose

Clarify where **system architecture** documentation ends and other specification sources begin. This kit does not replace feature specs, tickets, or API references — it **links** to them.

## Documentation layers

| Layer | What it covers | Typical location | How often it changes |
| --- | --- | --- | --- |
| **Feature / ticket specs** | User stories, acceptance criteria, sprint scope | Monday.com, `specs/`, PR description | Every ticket |
| **System architecture** (this kit) | Structure, boundaries, deploy, integrations, ADRs | `docs/architecture/`, `docs/adr/`, `docs/diagrams/` | When the system shape changes |
| **Component / API reference** | Props, endpoints, schemas | Storybook, OpenAPI, README in module folder | When APIs or UI contracts change |
| **Code + tests** | Runtime behavior | `src/`, tests | Every change |

**One fact, one owner.** Do not copy the same requirement into Monday and `overview.md`. Link instead.

## Spec-driven development

For spec-driven or AI-assisted work, read in this order:

1. **Ticket / feature spec** (if the task is tied to a ticket)
2. **[ai-context.md](./ai-context.md)** — project rules and entrypoint
3. **Relevant architecture page** (e.g. rendering-model, integrations)
4. **Code**

The kit validates that **system-level** docs stay complete. It does not validate individual feature specs — that stays in your ticket tool or `specs/` folder.

## External spec sources (fill in per project)

| Source | URL / path | Used for |
| --- | --- | --- |
| Issue tracker | _e.g. Monday.com board URL_ | Tickets, acceptance criteria |
| Feature specs | _e.g. `specs/` or Notion link_ | Detailed feature behavior |
| API contract | _e.g. OpenAPI, Postman_ | Request/response shapes |
| Design | _e.g. Figma link_ | Visual/UI specs |
| Component docs | _e.g. Storybook URL_ | UI component usage |

Delete rows that do not apply. Add rows for your project's tools.

## What belongs in `docs/architecture/`

**Yes — put it here:**

- Folder layout, rendering layers, deployment hosts
- Integrations, env vars, git/release process
- Cross-cutting constraints (e.g. "combat stays in Phaser")
- Diagrams of system components and data flow

**No — link from here instead:**

- Single-feature behavior for one sprint
- Full API field lists (summarize + link to OpenAPI)
- Copy-paste of ticket descriptions

## Change Rules

When you add a new external spec source, add a row to the table above and mention it in `ai-context.md` if agents should use it.
