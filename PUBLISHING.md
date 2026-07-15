# Publishing @folklore/architecture-kit

## GitHub Packages

The package publishes to `https://npm.pkg.github.com` under scope `@folklore`.

### One-time setup (maintainer)

1. Create a GitHub PAT with `write:packages` and `read:packages`
2. Authenticate:

```bash
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: PAT
```

### Publish

```bash
npm run build
npm publish
```

The `prepare` script ensures `dist/` is built on install from git or registry.

### Consume in host repos

Copy `.npmrc.example` to `.npmrc`:

```
@folklore:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then:

```bash
npm install -D @folklore/architecture-kit
```

### CI

GitHub Actions can use `GITHUB_TOKEN` to checkout the kit repo to `vendor/architecture-kit` (see rock-em-sock-em workflow) — no npm publish required for CI validation.
