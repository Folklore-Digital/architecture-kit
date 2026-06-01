# @folklore/architecture-kit

Repo-native architecture documentation and governance layer for any project.

**Storybook documents components. Architecture Kit documents architecture.**

Add repeatable architecture docs, Mermaid diagrams, ADRs, validation, and AI context to any repo.

## Install

```bash
npm install -D @folklore/architecture-kit
```

## Commands

```bash
npx architecture-kit init --type nextjs
npx architecture-kit validate
npx architecture-kit validate --ci
npx architecture-kit doctor
npx architecture-kit dev    # coming soon
npx architecture-kit build  # coming soon
```

## Project Types

| Type | Use Case |
| --- | --- |
| `nextjs` | Next.js App Router apps |
| `wordpress-custom` | Sage/custom themes, ACF, blocks |
| `wordpress-builder` | Divi, Elementor, builder-heavy sites |
| `craft` | Craft CMS + Twig projects |
| `generic` | Everything else |

## What Gets Scaffolded

```txt
/docs
  /architecture
    overview.md
    ...
  /adr
    0001-initial-architecture.md
  /diagrams
    system-overview.mmd
    data-flow.mmd
architecture.config.json
```

## Config

Machine-readable project metadata lives in `architecture.config.json` at the repo root. It tracks project type, stack, integrations, governance rules, and doc paths.

## Validation

`validate` checks:

- Config schema (Zod)
- Required folders and docs
- AI context file
- ADR and diagram presence
- Integrations listed in config appear in `integrations.md`

```bash
npx architecture-kit validate --level warn
npx architecture-kit validate --level error
npx architecture-kit validate --ci
```

## CI Example

```yaml
name: Architecture Docs Check

on:
  pull_request:

jobs:
  architecture-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx architecture-kit validate --ci
```

## Doctor

```bash
npx architecture-kit doctor
```

Example output:

```txt
Project: Inspire Web
Type: Next.js
Stack
  Frontend: Next.js App Router
  CMS: Contentful
Integrations: None configured
Docs health: 100%
Missing: None
```

## Design Principle

> If the architecture changes, the repo should say so.

## Roadmap

- [x] Phase 1 — Static docs scaffold (`init`)
- [x] Phase 3 — Validation (`validate`, `doctor`)
- [ ] Phase 2 — Local docs site (`dev`, `build`)
- [ ] Phase 4 — Project type detection
- [ ] Phase 5 — PR change awareness
- [ ] Phase 6 — AI tooling files (`AGENTS.md`, Cursor rules)

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm dev -- init --type generic
```

## License

MIT
