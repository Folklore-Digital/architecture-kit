# Folder structure (this repository)

Layout of **@folklore-digital/architecture-kit** itself.

```text
architecture-kit/
├── src/                    TypeScript source (compiled to dist/)
│   ├── cli.ts              Commander entry
│   ├── commands/           init, scan, bootstrap, validate, doctor, build, dev, detect, mcp
│   ├── config/             Zod schema + load architecture.config.json
│   ├── scan/               Project detection + agent-context formatting
│   ├── site/               Static HTML site (nav, search, mermaid, help)
│   ├── validators/         Links, mermaid, placeholders, integrations, deploy safety
│   ├── agent/              agent-pack.json writers
│   ├── mcp/                Stdio MCP server
│   └── utils/              FS scaffold, embed, docStatus, frontmatter helpers
├── templates/              Copied into host repos by init (never overwrite existing)
│   ├── nextjs/             Next.js architecture + ADR + diagram stubs
│   ├── wordpress-custom/   Sage-style WordPress
│   ├── wordpress-builder/
│   ├── craft/
│   ├── generic/
│   ├── embed/nextjs/       Host scripts + package.merge.json
│   ├── AGENTS.snippet.md   Default tool-agnostic agent entrypoint
│   ├── cursor/             Optional Cursor .mdc (init --adapters …,cursor)
│   ├── claude/             Optional CLAUDE.md + skill (--adapters …,claude)
│   ├── mcp/                Optional MCP config examples
│   └── deploy/             distignore / AI1WM / htaccess examples
├── docs/                   Handbook for *this* package (you are here)
├── tests/                  Vitest
├── dist/                   Build output (published)
├── README.md               Consumer-facing overview
├── CHANGELOG.md            Released changes
├── PUBLISHING.md           Public npm publish
├── VERSIONING.md           Semver policy
└── ROADMAP.md              Longer phases
```

## What ships on npm

`package.json` `files`: **`dist/`** + **`templates/`**. Host repos do not need this git tree; they install the package (or run a sibling clone via `ARCHITECTURE_KIT_LOCAL=1` / `node ../architecture-kit/dist/cli.js`).

## Host repo layout (after init or hand authoring)

```text
host-project/
├── architecture.config.json
├── docs/
│   ├── architecture/       system docs (overview, ai-context, …)
│   ├── adr/
│   ├── diagrams/           *.mmd
│   ├── _archive/           optional; skipped by the docs site
│   └── …                   feature guides (linked, not owned by the kit)
├── .architecture-kit/      generated (usually gitignored)
└── public/architecture/    optional embedded HTML build
```

## Related

- [How it works](./how-it-works.md)
- [templates/](../templates/) — edit templates when changing default host scaffolds
