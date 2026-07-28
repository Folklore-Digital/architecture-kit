# @folklore/architecture-kit

Repo-native **system architecture** documentation and governance for Folklore projects.

**Storybook documents components. Architecture Kit documents how the system is built.**

This kit covers **structure, boundaries, deployment, integrations, and decisions** — not every feature spec or ticket. Feature specs, API contracts, and design files live elsewhere and are **linked**, not duplicated. See [Documentation layers](#documentation-layers) below.

Use it to give developers, designers, and clients one consistent place to understand how the system fits together — then **validate** that those docs stay current.

---

## Goals

1. **Consistent documentation** across Next.js, WordPress, Craft, and other stacks
2. **Onboarding** — new developers know where code lives and which patterns to follow
3. **Governance** — scripts flag missing docs, placeholder content, and undocumented integrations
4. **Browseable site** — HTML for stakeholders; Markdown sources available alongside
5. **Package boundary** — the kit installs as a dev dependency; host-app embedding (mount path, redirects) stays in each repo

> If the architecture changes, the repo should say so.

---

## Quick start (new Next.js project)

```bash
npm install -D "git+ssh://git@github.com/Folklore-Digital/architecture-kit.git#semver:^0.3.0"
npx architecture-kit detect                    # optional: suggest project type
npx architecture-kit init --type nextjs --embed nextjs
npm install
# Fill in architecture.config.json and docs/architecture/*.md
npm run architecture:validate
npm run dev                                    # game/app + docs at /architecture/
```

**`init` never overwrites existing docs** — safe to re-run; it only adds missing scaffold files.

### What `--embed nextjs` adds

| Item | Purpose |
| --- | --- |
| `docs/` | Architecture markdown, ADRs, diagrams (skip-if-exists) |
| `architecture.config.json` | Project metadata + governance (skip-if-exists) |
| `scripts/build-architecture-site.mjs` | Build + embed docs to `public/architecture/` |
| `scripts/embed-architecture-site.mjs` | Rewrite links for `/architecture/` mount |
| `scripts/run-architecture-kit.mjs` | Run validate/doctor/build via installed kit |
| `package.json` scripts | `predev`, `build-dev`, `architecture:*` (merge only) |
| `.cursor/rules/architecture-kit.mdc` | Agent entrypoint (skip-if-exists) |

One manual step: add `/architecture` redirect — see `docs/architecture/_embed-host-setup.md`.

### Updating the kit (all host projects)

In **architecture-kit** only:

```bash
npm version patch && git push origin main --tags
```

In host projects: `npm install` / `yarn install` / `pnpm install`, or `npm run build-dev` — no repo changes needed while semver range matches.

Local kit hacking: `export ARCHITECTURE_KIT_LOCAL=1` then `npm run dev` or `yarn dev`.

### Yarn / pnpm host repos

Embed scripts **auto-detect** the lockfile (`yarn.lock`, `pnpm-lock.yaml`, `package-lock.json`) and run `yarn up`, `pnpm update`, or `npm update` accordingly.

Install the kit with your package manager:

```bash
# Yarn Classic (Sage/Bud projects)
yarn add -D "@folklore/architecture-kit@git+ssh://git@github.com/Folklore-Digital/architecture-kit.git#semver:^0.3.0"

# Yarn Berry (v2+)
yarn add -D "@folklore/architecture-kit@git+ssh://git@github.com/Folklore-Digital/architecture-kit.git#semver:^0.3.0"

npx architecture-kit init --type wordpress-custom
yarn install
yarn architecture:validate
```

Requirements:
- SSH deploy key with **read access to architecture-kit** (private git dependency)
- Git tag `v0.3.x` published on the kit repo (semver resolution)
- Do **not** mix `npm install` in a Yarn repo (creates `package-lock.json` and confuses detection)

If install fails with `ENOVERSIONS` or "No versions available", the git tag is missing — verify `v0.3.0+` exists on GitHub.

---

## Quick start (standalone docs, no app embed)

```bash
npm install -D @folklore/architecture-kit
npx architecture-kit init --type nextjs
npx architecture-kit validate
npx architecture-kit dev               # http://127.0.0.1:4321
```

---

## Quick start (existing project — bootstrap for AI)

Already have code but no architecture docs? Scan the repo and hand context to your AI agent:

```bash
npx architecture-kit scan                    # → .architecture-kit/agent-context.md
npx architecture-kit bootstrap --apply       # scaffold missing docs + merge detected stack
# Give agent-context.md to Cursor / your agent to fill docs/architecture/*.md
npx architecture-kit validate
```

---

## Commands

| Command | Purpose |
| --- | --- |
| `init --type <type>` | Scaffold `docs/`, ADRs, diagrams, `architecture.config.json` (skip existing files) |
| `init --embed nextjs` | Also copy host scripts + merge `package.json` for Next.js at `/architecture/` |
| `scan` | Detect stack, integrations, doc gaps; write `.architecture-kit/agent-context.md` for AI agents |
| `bootstrap [--apply]` | Scan + write JSON context; `--apply` scaffolds missing docs and merges config |
| `validate` | Config, docs, **broken links**, **Mermaid syntax**, placeholders, integrations, optional Storybook |
| `validate --ci` | CI mode — fail on errors |
| `doctor` | Human-readable docs health summary |
| `detect` | Infer project type from repo signals |
| `build` | Static HTML site with **search** and **last-updated dates** + copied Markdown sources |
| `dev` | Build and serve docs locally |

Project types: `nextjs`, `wordpress-custom`, `wordpress-builder`, `craft`, `generic`

---

## What gets scaffolded

```txt
docs/
  README.md                 ← index: who reads what, doc map
  architecture/
    overview.md               ← start here (everyone)
    project-structure.md      ← folders, routes, modules
    rendering-model.md        ← SSR / client / runtime layers
    data-fetching.md          ← data sources and flow
    content-models.md           ← schemas, CMS types, registries
    integrations.md           ← third-party services
    environments.md             ← URLs, branches, env vars
    deployment.md               ← build, deploy, servers
    quality-gates.md            ← lint, test, format, validate
    component-conventions.md    ← shared UI patterns vs custom
    server-vs-client.md
    scripts-and-load-order.md
    ai-context.md               ← AI assistant rules
    documentation-map.md        ← where specs live; SDD layering
  adr/
    0001-initial-architecture.md
  diagrams/
    system-overview.mmd
    data-flow.mmd
architecture.config.json
```

Not every doc applies to every project — replace scaffold text with real content and delete sections that do not apply.

---

## Documentation layers

Architecture Kit is **one layer** in a larger documentation stack. Multiple doc sources are intentional — each layer has a different owner and lifecycle.

| Layer | Owner | Typical location | Changes when |
| --- | --- | --- | --- |
| Feature / ticket specs | PM / ticket | Monday, `specs/`, PR | Every sprint |
| **System architecture** (this kit) | Engineering | `docs/architecture/`, ADRs, diagrams | System shape changes |
| Component / API reference | Engineering / design | Storybook, OpenAPI, module READMEs | API or UI contract changes |
| Code + tests | Engineering | `src/` | Every change |

**One fact, one owner.** Do not copy ticket acceptance criteria into `overview.md`. Link from `docs/architecture/documentation-map.md` (scaffolded on `init`) instead.

### What this kit is not

- Not a replacement for Monday, Notion, or feature `specs/` folders
- Not a CMS or wiki for sprint-level requirements
- Not Storybook or OpenAPI — though it should **link** to them

### Spec-driven development

For spec-driven or AI-assisted work, recommended read order:

1. Ticket / feature spec (when the task is ticket-scoped)
2. `docs/architecture/ai-context.md`
3. Relevant architecture page (rendering model, integrations, etc.)
4. Code

The kit **validates system architecture completeness** (integrations documented, placeholders filled, ADRs for major decisions). Per-feature spec quality stays in your ticket process.

Each repo tunes strictness via `architecture.config.json` governance flags.

**Releasing the kit:** bump version, tag `vX.Y.Z`, push — see [VERSIONING.md](./VERSIONING.md).

---

## Documentation guide

### For developers

Read **overview → project-structure → rendering-model → ai-context → documentation-map**. Run `validate` before opening a PR.

### For designers / clients

Read **overview** and browse **diagrams/** on the docs site. No repo access required once the site is deployed.

### For leads / DevOps

Read **deployment**, **environments**, **integrations**, **quality-gates**. Optionally add `validate` to each repo's existing CI pipeline.

### ADRs

Use `docs/adr/` for decisions that change structure, integrations, or conventions. Number sequentially: `0002-short-title.md`.

### Diagrams

Keep `system-overview.mmd` (components + infra) and `data-flow.mmd` (request/data path) updated. Mermaid renders on the docs site.

---

## Validation

`validate` checks:

- `architecture.config.json` schema (Zod)
- Required folders and architecture markdown files
- Key docs: `overview.md`, `deployment.md`, `ai-context.md`
- **Broken internal doc links** across `docs/**/*.md`
- **Mermaid syntax** (balanced brackets, diagram type) in `docs/diagrams/*.mmd`
- Integrations in config appear in `integrations.md`
- **Optional Storybook** — when `storybook.enabled`, warns if URL or documentation-map link missing
- **Governance**: integration ADR mentions, `.env.example` keys in `environments.md`
- **AI tooling**: `.cursor/rules/architecture-kit.mdc`, `AGENTS.md` or `CLAUDE.md`
- **Diff awareness** (`--since origin/develop`): code changes without matching doc updates
- **Placeholder content** in docs (`_TBD_`, `_Example_`, unfilled scaffold text) — warns

```bash
npx architecture-kit validate --level warn   # show warnings
npx architecture-kit validate --level error    # errors only
npx architecture-kit validate --ci
npx architecture-kit validate --since origin/develop   # diff-aware warnings
```

### CI example (optional — per repo)

Each host repo chooses whether and how to run validation. Example step for an existing workflow:

```yaml
- run: npm run architecture:validate -- --ci --since origin/develop
```

If the kit is private, checkout it to `vendor/architecture-kit` in the same job (see rock-em-sock-em `scripts/lib/resolve-kit.mjs`). Tune governance in each repo's `architecture.config.json`.

---

## Local docs site

```bash
npx architecture-kit build
npx architecture-kit build --out ./site
npx architecture-kit dev --port 4321
```

- Builds HTML with sidebar navigation and **client-side search** (`search-index.json`)
- Shows **last updated** (git or file mtime) and optional **last reviewed** (YAML frontmatter: `reviewed:` / `lastReviewed:`)
- **Copies Markdown sources** next to HTML — each page has a “View Markdown source” link
- Default output: `.architecture-kit/site` (standalone, relative links)

### Embedding in a host app (e.g. Next.js)

The kit does **not** modify your app framework. In the host repo:

1. `architecture-kit build --out public/your-mount/`
2. Post-process links for your mount path (see rock-em-sock-em `scripts/embed-architecture-site.mjs`)
3. Add a redirect for `/your-mount` → `/your-mount/`

This keeps the package reusable across WordPress, Next.js, static sites, etc.

---

## Config (`architecture.config.json`)

Machine-readable metadata: project type, stack, integrations, governance flags, doc paths.

Governance flags (enforced where noted):

| Flag | Meaning | Enforced |
| --- | --- | --- |
| `newIntegrationRequiresDocs` | Must update `integrations.md` | Yes |
| `newIntegrationRequiresAdr` | Significant integrations need an ADR mention | Yes (warn) |
| `newEnvVarRequiresDocs` | Must update `environments.md` | Yes (warn, when `.env.example` exists) |
| `newExternalScriptRequiresDocs` | Must update `scripts-and-load-order.md` | Planned |
| `newClientComponentRequiresReason` | Client boundaries documented | Planned |
| `newPackageRequiresReview` | New npm deps need review | Planned |

### Optional Storybook (only when used)

```json
"storybook": {
  "enabled": true,
  "url": "http://localhost:6006",
  "docsPath": ".storybook/README.md"
}
```

When enabled, the docs site sidebar links to Storybook and `validate` checks that `documentation-map.md` references it. Projects without Storybook omit this block entirely.

### Site options

```json
"site": {
  "showDates": true,
  "dateSource": "git"
}
```

Use YAML frontmatter on any doc for explicit review dates:

```yaml
---
reviewed: 2026-07-28
---
```

---

## Component conventions (philosophy)

Architecture Kit does not replace Storybook. Document **which shared components to use** in `component-conventions.md` (e.g. always use `ThemeSlot` + theme `Button`, not raw `<button>` for primary actions).

Today: manual review + placeholder validation.  
Roadmap: optional ESLint or custom rules wired through config.

---

## Roadmap

- [x] Phase 1 — Scaffold (`init`)
- [x] Phase 2 — Docs site (`dev`, `build`, Markdown sources)
- [x] Phase 3 — Validation (`validate`, `doctor`, placeholder detection)
- [x] Phase 4 — Project type detection (`detect`)
- [x] Phase 5 — PR change awareness (`validate --since`)
- [x] Phase 6 — AI tooling sync (`AGENTS.md`, Cursor rules templates)
- [x] Phase 7 — Link + Mermaid validation, docs search, dates, `scan` / `bootstrap`
- [ ] Phase 8 — Convention checks (component registry, custom lint rules)
- [ ] Phase 9 — `--embed wordpress-custom` (Sage/Bud static embed)

---

## Publishing (GitHub Packages)

Private install without a sibling clone:

1. Copy `.npmrc.example` to `.npmrc` and set a GitHub PAT with `read:packages` / `write:packages`
2. Publish from maintainers:

```bash
npm run build
npm publish
```

3. In host repos:

```bash
npm install -D @folklore/architecture-kit
```

Or keep using `vendor/architecture-kit` / `../architecture-kit` (recommended for monorepo-style local dev).

---

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm dev -- init --type generic
```

## License

MIT
