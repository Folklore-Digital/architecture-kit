# How it works

## One-sentence model

**Markdown in the host repo is the product.** The kit is a CLI + static site + validators that make that Markdown easier to browse, check, and hand to agents.

## Layers

```text
Host repo (source of truth)
├── docs/**/*.md          ← humans + git + PRs
├── docs/diagrams/*.mmd   ← Mermaid sources
├── docs/adr/*.md         ← decisions
└── architecture.config.json  ← optional machine metadata

Architecture kit (optional tooling)
├── build / dev           ← HTML site + search
├── validate / doctor     ← gaps, links, governance
├── scan / bootstrap      ← optional accelerators
└── mcp                   ← optional agent bridge
```

## What is required vs optional

| Artifact | Required for “having architecture docs”? | Required for kit tools? |
| --- | --- | --- |
| Markdown under `docs/` | Yes (that *is* the docs) | Yes, for the site to show something |
| `architecture.config.json` | No (nice for validate / nav) | Needed for most CLI commands |
| `@folklore-digital/architecture-kit` installed | **No** | Yes |
| `scan` / `bootstrap` / greenfield prompt | **No** | Only if you want scaffolding help |
| Embed in Next/WordPress (`/architecture/`) | **No** | Only if you want docs inside the app |
| CI `validate --ci` | **No** | Only if the team opts in |

## Mental model for skeptics

1. **Without the package:** open `docs/architecture/overview.md` in the IDE or on GitHub. Done.
2. **With the package:** same files, plus `architecture-kit dev` for a navigable site, banners for scaffold/draft pages, and `validate` for broken links.
3. **Remove the package:** delete the dependency and any embed scripts. Markdown remains. See [removal.md](./removal.md).

## Host vs kit repo

| Repo | Role |
| --- | --- |
| **architecture-kit** (this) | CLI, templates, site renderer, validators — versioned npm package |
| **Host** (rock-em, pontoons, inspire, …) | Real architecture content for that product |

Do not put product-specific Epicor/Contentful details in this kit repo — put them in the host’s `docs/architecture/`.

## Related

- [Folder structure](./folder-structure.md) — where code lives in *this* repo
- [Status & color coding](./status-and-color-coding.md) — sidebar banners on the docs site
- Root [README](../README.md) — install and commands
