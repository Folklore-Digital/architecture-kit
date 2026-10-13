# Removing architecture-kit from a host repo

The kit is designed so removal does **not** destroy your documentation. You keep Markdown; you lose the package-powered site, validate CLI, and optional embed.

## What you keep

- `docs/**/*.md`, `docs/adr/`, `docs/diagrams/*.mmd`
- Feature guides and anything else under `docs/`
- Frontmatter (`status`, `navGroup`, …) — harmless YAML; GitHub/IDE still render Markdown

## What you lose (unless you replace it)

- `architecture-kit` / `npx architecture-kit` / `npm run docs:*` / `architecture:*` scripts
- Generated HTML under `.architecture-kit/site` or `public/architecture/`
- Validate/doctor/MCP/scan/bootstrap
- Host embed scripts that only exist to build/mount the kit site

## Checklist (host repo)

1. **Confirm docs are committed** — architecture Markdown is in git and reviewed.
2. **Remove the dependency** from `package.json` / lockfile:
   - `dependencies` / `devDependencies` / `optionalDependencies` entry for `@folklore-digital/architecture-kit`
3. **Remove kit-only scripts**, for example:
   - `architecture:*`, `docs:dev`, `docs:validate`, `docs:doctor`
   - `predev` / `build-dev` steps that only build the architecture site (keep app `dev`/`build`)
4. **Delete embed helpers** if present (Next example):
   - `scripts/build-architecture-site.mjs`
   - `scripts/embed-architecture-site.mjs`
   - `scripts/run-architecture-kit.mjs`
   - `scripts/ensure-kit-*.mjs` / `scripts/lib/resolve-kit.mjs` (kit-only)
5. **Stop mounting docs in the app** — remove `/architecture` redirects, middleware allowlists, or static `public/architecture/` from deploy artifacts if you no longer want HTML there.
6. **Agent hooks (optional cleanup):**
   - `.cursor/rules/architecture-kit.mdc`
   - Kit snippets in `AGENTS.md` / `CLAUDE.md`
   - `.claude/skills/architecture-kit/`
7. **Config (optional):** keep `architecture.config.json` as team metadata, or delete if unused.
8. **Gitignore:** you may remove `.architecture-kit/` and `public/architecture/` entries once those dirs are gone.
9. **CI:** drop any `architecture:validate` / kit install steps (and any leftover registry auth that existed only for this kit).
10. **Run a normal install** (`npm ci` / `yarn` / etc.) and confirm app build/deploy still work.

## Minimal removal (docs stay, tooling gone)

```bash
# Example — adjust for yarn/pnpm
npm uninstall @folklore-digital/architecture-kit
# Then edit package.json scripts and delete scripts/*architecture* by hand
```

Leave `docs/` and (if you want) `architecture.config.json` in place.

## Re-adding later

Install the package again and point CLI at the existing `docs/` tree. Prefer **not** re-running `init` over filled docs (`init` skips existing files; still safer to validate paths first). See root [README](../README.md).

## Philosophy

If removal feels scary, the docs were never only in the kit — they should already live as Markdown in git. See [How it works](./how-it-works.md).
