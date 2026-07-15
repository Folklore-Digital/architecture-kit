# Architecture documentation

This folder is managed with **@folklore/architecture-kit**. It is the source of truth for **system architecture** — how this project is structured, deployed, and governed.

Feature specs, tickets, and API references live elsewhere. See [architecture/documentation-map.md](./architecture/documentation-map.md) for the full documentation stack.

## Who reads what

| Audience | Start here |
| --- | --- |
| New developers | [architecture/overview.md](./architecture/overview.md) → [project-structure.md](./architecture/project-structure.md) |
| Designers / PMs | [architecture/overview.md](./architecture/overview.md) → [diagrams/system-overview.md](./diagrams/system-overview.md) |
| DevOps / leads | [architecture/deployment.md](./architecture/deployment.md) → [environments.md](./architecture/environments.md) |
| AI tools | [architecture/ai-context.md](./architecture/ai-context.md) → [documentation-map.md](./architecture/documentation-map.md) |

## Documentation layers

| Layer | Location in this repo |
| --- | --- |
| System architecture (this kit) | `docs/architecture/`, `docs/adr/`, `docs/diagrams/` |
| Feature / ticket specs | _Fill in [documentation-map.md](./architecture/documentation-map.md)_ |
| Component / API reference | _Storybook, OpenAPI, module READMEs — link from documentation-map_ |

For spec-driven development: ticket spec → `ai-context.md` → relevant architecture page → code.

## Document map

| Doc | Purpose |
| --- | --- |
| [overview.md](./architecture/overview.md) | What the project is and how it fits together |
| [documentation-map.md](./architecture/documentation-map.md) | Where specs live; what belongs in architecture docs |
| [project-structure.md](./architecture/project-structure.md) | Folders, routes, major modules |
| [rendering-model.md](./architecture/rendering-model.md) | SSR, client boundaries, runtime layers |
| [data-fetching.md](./architecture/data-fetching.md) | Where data lives and how it flows |
| [content-models.md](./architecture/content-models.md) | Content types, schemas, registries |
| [integrations.md](./architecture/integrations.md) | Third-party services and load order |
| [environments.md](./architecture/environments.md) | URLs, branches, env vars |
| [deployment.md](./architecture/deployment.md) | Build, deploy, CI |
| [quality-gates.md](./architecture/quality-gates.md) | Lint, test, format, validate |
| [component-conventions.md](./architecture/component-conventions.md) | UI patterns — reuse vs custom |
| [server-vs-client.md](./architecture/server-vs-client.md) | Server vs client component rules |
| [scripts-and-load-order.md](./architecture/scripts-and-load-order.md) | Third-party scripts |
| [ai-context.md](./architecture/ai-context.md) | Rules for AI-assisted development |
| [adr/](./adr/) | Architecture decision records |
| [diagrams/](./diagrams/) | Mermaid diagrams |

## Commands

```bash
npx architecture-kit validate
npx architecture-kit doctor
npx architecture-kit build
npx architecture-kit dev
```

## Keeping docs current

> If the architecture changes, the repo should say so.

Update **system architecture** docs in the same PR as code when you change routes, integrations, env vars, deployment, or cross-cutting conventions. Feature-only changes update ticket specs — link or summarize here only when boundaries change.
