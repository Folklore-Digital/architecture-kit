# Versioning and releases

Every **published change** to `@folklore-digital/architecture-kit` must bump `package.json` version and push a matching git tag. Host repos use **`@folklore-digital/architecture-kit@^X.Y.Z`** from the **public npm registry** (or a public git semver URL).

## Version lines

| Line | Meaning |
| --- | --- |
| **0.5.x** | Pre-release agent-pack track; superseded by **1.0.0** |
| **1.0.0–1.2.x** | Published to GitHub Packages (private installs) |
| **1.3.0+** | Public GitHub repo + public npm (`registry.npmjs.org`) |

## When to bump

| Change | Bump |
| --- | --- |
| Site UI, validators, templates, CLI, MCP | **minor** (`1.3.0` → `1.4.0`) |
| Bug fixes | **patch** (`1.3.0` → `1.3.1`) |
| Breaking config schema or CLI flags | **major** (`2.0.0`) |

## Release steps (public npm)

```bash
# From architecture-kit on main
npm run build
npm test

# Update CHANGELOG.md [Unreleased] → version section, then:
npm version minor   # or patch / major — updates package.json, commits, tags vX.Y.Z
git push origin main --tags
npm publish --access public
```

User-facing notes for each release live in [CHANGELOG.md](./CHANGELOG.md).

Host projects with `"@folklore-digital/architecture-kit": "^1.3.0"` pick up compatible releases on `npm update` / `npm install`.

## Git install (optional)

```bash
npm install -D "github:Folklore-Digital/architecture-kit#semver:^1.3.0"
```

Works without a PAT because the repository is public.

## Local kit development

When editing **architecture-kit** and a host repo side by side:

```bash
export ARCHITECTURE_KIT_LOCAL=1
npm run dev   # in the host repo — resolves ../architecture-kit first
```

Do not set `ARCHITECTURE_KIT_LOCAL` on CI or production servers.
