# Publishing @folklore/architecture-kit

**v1.0.0** is the first stable release on **GitHub Packages** (npm registry). The `0.5.x` line on `feature/agent-pack` was pre-release development; host repos should migrate from `git+ssh://...#feature/agent-pack` to registry semver.

## GitHub Packages (recommended)

Registry: `https://npm.pkg.github.com` · scope: `@folklore`

### One-time setup (maintainer)

1. Create a GitHub PAT with `write:packages` and `read:packages`
2. Authenticate:

```bash
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: PAT
```

### Publish a release

From `main` after merging `feature/agent-pack`:

```bash
npm run build
npm test
npm version patch   # or minor/major — creates git tag vX.Y.Z
git push origin main --tags
npm publish         # or: npm run publish:github
```

### Consume in host repos

**1. Registry auth** — copy `.npmrc.example` to `.npmrc` (host repo or user home):

```
@folklore:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

**2. Install** (preferred — no git SSH, no `npm update` git quirks):

```bash
npm install -D @folklore/architecture-kit@^1.0.0
```

New projects from `init --embed nextjs` get `"@folklore/architecture-kit": "^1.0.0"` in `package.json` automatically.

**3. Embed scripts** — `ensure-kit-install.mjs` runs `npm update @folklore/architecture-kit` on dev/build; works with registry semver.

### CI (GitHub Actions)

Use `GITHUB_TOKEN` with `packages: read` or a PAT in `.npmrc`:

```yaml
- run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Alternatively checkout the kit to `vendor/architecture-kit` for validate-only jobs (no registry needed).

---

## Git install (fallback)

When registry auth is not available (external contractors, air-gapped):

```bash
npm install -D "git+ssh://git@github.com/Folklore-Digital/architecture-kit.git#semver:^1.0.0"
```

Git tags must match published versions. Prefer registry for Folklore host repos.

---

## Local development

```bash
export ARCHITECTURE_KIT_LOCAL=1   # host repo resolves ../architecture-kit first
npm run dev
```

Do not set `ARCHITECTURE_KIT_LOCAL` on CI or production servers.

---

## Migration checklist (host repos)

- [ ] Merge kit `feature/agent-pack` → `main`, publish `@folklore/architecture-kit@1.0.0`
- [ ] Add `.npmrc` with `@folklore:registry` (or org-level auth)
- [ ] Replace `git+ssh://...#feature/agent-pack` with `^1.0.0` in `package.json`
- [ ] `npm install` && `npm run architecture:validate -- --ci`
- [ ] Remove `ARCHITECTURE_KIT_LOCAL` from server deploy scripts

See [VERSIONING.md](./VERSIONING.md).
