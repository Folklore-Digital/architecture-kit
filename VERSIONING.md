# Versioning and releases

Every **published change** to `@folklore/architecture-kit` must bump `package.json` version and push a matching git tag. Host repos depend on `#semver:^X.Y.Z` and refresh on `npm install` / `npm update` — no manual sibling-clone pulls.

## When to bump

| Change | Bump |
| --- | --- |
| Site UI, validators, templates, CLI behavior | **minor** (`0.2.0` → `0.3.0`) |
| Bug fixes, link/build fixes | **patch** (`0.2.0` → `0.2.1`) |
| Breaking config schema or CLI flags | **major** (`1.0.0`) |

## Release steps

```bash
# From architecture-kit repo on main
npm run build
npm test

npm version patch   # or minor / major — updates package.json, commits, tags vX.Y.Z
git push origin main --tags

# Optional: GitHub Packages
npm publish
```

Host projects with `"@folklore/architecture-kit": "git+ssh://...#semver:^0.2.0"` pick up the new tag on the next `npm run build-dev` or `npm run dev` (scripts run `npm update @folklore/architecture-kit`).

## Local kit development

When editing **architecture-kit** and **rock-em-sock-em** side by side, use the sibling clone without publishing:

```bash
export ARCHITECTURE_KIT_LOCAL=1
npm run dev   # in the host repo — resolves ../architecture-kit first
```

Do not set `ARCHITECTURE_KIT_LOCAL` on CI or the dev server.
