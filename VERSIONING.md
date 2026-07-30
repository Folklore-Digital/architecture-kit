# Versioning and releases

Every **published change** to `@folklore-digital/architecture-kit` must bump `package.json` version and push a matching git tag. Host repos use **`@folklore-digital/architecture-kit@^X.Y.Z`** from GitHub Packages (preferred) or git semver tags (fallback).

## Version lines

| Line | Meaning |
| --- | --- |
| **0.5.x** | Pre-release agent-pack track (`feature/agent-pack`); superseded by **1.0.0** |
| **1.0.0+** | Stable npm registry releases (GitHub Packages) |

## When to bump

| Change | Bump |
| --- | --- |
| Site UI, validators, templates, CLI, MCP | **minor** (`1.0.0` → `1.1.0`) |
| Bug fixes | **patch** (`1.0.0` → `1.0.1`) |
| Breaking config schema or CLI flags | **major** (`2.0.0`) |

## Release steps (registry)

```bash
# From architecture-kit on main
npm run build
npm test

npm version patch   # or minor / major — updates package.json, commits, tags vX.Y.Z
git push origin main --tags
npm publish         # GitHub Packages — see PUBLISHING.md
```

Host projects with `"@folklore-digital/architecture-kit": "^1.0.0"` pick up compatible releases on `npm update` / `npm install` (embed scripts run update on dev/build).

## Git-tag fallback

```bash
npm install -D "git+ssh://git@github.com/Folklore-Digital/architecture-kit.git#semver:^1.0.0"
```

Tags must match registry versions. Use registry for Folklore repos when possible.

## Local kit development

When editing **architecture-kit** and a host repo side by side:

```bash
export ARCHITECTURE_KIT_LOCAL=1
npm run dev   # in the host repo — resolves ../architecture-kit first
```

Do not set `ARCHITECTURE_KIT_LOCAL` on CI or the dev server.
