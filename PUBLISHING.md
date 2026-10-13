# Publishing @folklore-digital/architecture-kit

The kit is a **public** GitHub repo and publishes to the **public npm registry** (`registry.npmjs.org`). Consumers do **not** need a GitHub PAT or `.npmrc` scope mapping.

## Install (host repos)

```bash
npm install -D @folklore-digital/architecture-kit@^1.3.0
# or: yarn add -D / pnpm add -D
```

No auth files required for install.

### Git install (optional)

If you prefer pinning to the GitHub repo (also public, no PAT):

```bash
npm install -D "github:Folklore-Digital/architecture-kit#semver:^1.3.0"
```

---

## Maintainer: publish a release

### One-time

1. Create or join the **`folklore-digital`** org on [npmjs.com](https://www.npmjs.com) (scoped packages need an org or user scope you own).
2. `npm login` (registry defaults to `https://registry.npmjs.org`).
3. Ensure you can publish under `@folklore-digital` with **public** access.

### Each release

From `main`:

```bash
npm run build
npm test
# Move CHANGELOG [Unreleased] → version section
npm version minor   # or patch / major — tags vX.Y.Z
git push origin main --tags
npm publish --access public
```

`package.json` `publishConfig` already targets the public registry.

---

## Local development

```bash
export ARCHITECTURE_KIT_LOCAL=1   # host repo resolves ../architecture-kit first
npm run dev
```

Do not set `ARCHITECTURE_KIT_LOCAL` on CI or production servers.

---

## Migration from GitHub Packages (private)

Host repos that used private GitHub Packages:

1. Remove `@folklore-digital:registry=…` and `//npm.pkg.github.com/:_authToken=…` from project/user `.npmrc` (unless still needed for other private packages).
2. Set dependency to `"@folklore-digital/architecture-kit": "^1.3.0"` (npmjs) or the public git semver URL above.
3. `npm install` / `yarn` / `pnpm install` — should work with no PAT.
4. Drop CI secrets that existed only for this kit.

See [VERSIONING.md](./VERSIONING.md) and [CHANGELOG.md](./CHANGELOG.md).
