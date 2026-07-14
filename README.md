# @folklore/architecture-kit

Repo-native architecture documentation and governance for Folklore projects.

**Storybook documents components. Architecture Kit documents how the system is built.**

Use it to give developers, designers, and clients one consistent place to understand structure, deployment, patterns, and decisions — then **validate** that docs stay current.

---

## Goals

1. **Consistent documentation** across Next.js, WordPress, Craft, and other stacks
2. **Onboarding** — new developers know where code lives and which patterns to follow
3. **Governance** — scripts flag missing docs, placeholder content, and undocumented integrations
4. **Browseable site** — HTML for stakeholders; Markdown sources available alongside
5. **Package boundary** — the kit installs as a dev dependency; host-app embedding (mount path, redirects) stays in each repo

> If the architecture changes, the repo should say so.

---

## Quick start

```bash
npm install -D @folklore/architecture-kit
npx architecture-kit detect          # optional: suggest project type
npx architecture-kit init --type nextjs
# Edit architecture.config.json and docs/architecture/*.md
npx architecture-kit validate
npx architecture-kit doctor
npx architecture-kit dev               # local site at http://127.0.0.1:4321
```

---

## Commands

| Command | Purpose |
| --- | --- |
| `init --type <type>` | Scaffold `docs/`, ADRs, diagrams, `architecture.config.json` |
| `validate` | Check config schema, required docs, integrations, placeholder content |
| `validate --ci` | CI mode — fail on errors |
| `doctor` | Human-readable docs health summary |
| `detect` | Infer project type from repo signals |
| `build` | Static HTML site + copied Markdown sources |
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
  adr/
    0001-initial-architecture.md
  diagrams/
    system-overview.mmd
    data-flow.mmd
architecture.config.json
```

Not every doc applies to every project — replace scaffold text with real content and delete sections that do not apply.

---

## Documentation guide

### For developers

Read **overview → project-structure → rendering-model → ai-context**. Run `validate` before opening a PR.

### For designers / clients

Read **overview** and browse **diagrams/** on the docs site. No repo access required once the site is deployed.

### For leads / DevOps

Read **deployment**, **environments**, **integrations**, **quality-gates**. Wire `validate --ci` into GitHub Actions.

### ADRs

Use `docs/adr/` for decisions that change structure, integrations, or conventions. Number sequentially: `0002-short-title.md`.

### Diagrams

Keep `system-overview.mmd` (components + infra) and `data-flow.mmd` (request/data path) updated. Mermaid renders on the docs site.

---

## Validation

`validate` currently checks:

- `architecture.config.json` schema (Zod)
- Required folders and architecture markdown files
- `ai-context.md` present
- ADR and diagram presence
- Integrations in config appear in `integrations.md`
- **Placeholder content** in docs (`_TBD_`, `_Example_`, unfilled scaffold text) — warns

Future (roadmap): PR change awareness, component convention lint rules, cross-doc link integrity.

```bash
npx architecture-kit validate --level warn   # show warnings
npx architecture-kit validate --level error    # errors only
npx architecture-kit validate --ci
```

### CI example

```yaml
name: Architecture Docs
on: [pull_request]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx architecture-kit validate --ci
```

---

## Local docs site

```bash
npx architecture-kit build
npx architecture-kit build --out ./site
npx architecture-kit dev --port 4321
```

- Builds HTML with sidebar navigation
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

Governance flags (document intent; validation expands over time):

| Flag | Meaning |
| --- | --- |
| `newIntegrationRequiresDocs` | Must update `integrations.md` |
| `newIntegrationRequiresAdr` | Significant integrations need an ADR |
| `newEnvVarRequiresDocs` | Must update `environments.md` |
| `newExternalScriptRequiresDocs` | Must update `scripts-and-load-order.md` |
| `newClientComponentRequiresReason` | Client boundaries documented |
| `newPackageRequiresReview` | New npm deps need review |

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
- [ ] Phase 5 — PR change awareness (validate docs touched by diff)
- [ ] Phase 6 — AI tooling sync (`AGENTS.md`, Cursor rules templates)
- [ ] Phase 7 — Convention checks (component registry, custom lint rules)

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
