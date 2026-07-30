# Next.js host embed setup

Scaffolded by `npx architecture-kit init --embed nextjs`. One-time checks after init:

## 1. Redirect `/architecture` → `/architecture/`

Add to `next.config.ts` (adjust if your mount path differs):

```typescript
/** Reserved mount path for architecture-kit static docs. */
export const ARCHITECTURE_DOCS_PATH = "/architecture";

const nextConfig = {
  async redirects() {
    return [
      {
        source: ARCHITECTURE_DOCS_PATH,
        destination: `${ARCHITECTURE_DOCS_PATH}/`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

Must match `site.mountPath` in `architecture.config.json` (default `/architecture/`). Embed scripts read `architecture.config.json` or `.architecture-kit/embed-manifest.json` after build.

## 2. Gitignore built docs

`init --embed nextjs` appends generated output paths to `.gitignore` automatically:

- `site.outputDir` (default `public/architecture/`)
- `paths.agentOutput` (default `.architecture-kit/`)

Override in config when needed:

```json
{
  "site": {
    "mountPath": "/internal/architecture/",
    "outputDir": "public/internal-architecture"
  },
  "paths": {
    "agentOutput": ".architecture-kit"
  }
}
```

Built output is regenerated on `npm run dev` / `build-dev`. Run `validate` to warn if built HTML is still tracked in git.

## 3. Production exposure (dev/staging only by default)

`architecture.config.json` → `site.exposure` defaults to `dev-staging`. Built docs should **not** appear on public production unless you set `production` intentionally.

**Next.js:** merge `middleware.architecture-docs.example.ts` into your app middleware to return 404 for `/architecture/` in production. See `docs/architecture/deploy-safety/` for WordPress rsync and migration excludes.

```bash
npx architecture-kit validate --deploy-artifact ./path-to-build-output
```

## 4. Deploy command

Use `npm run build-dev` (not plain `next build`) so docs are embedded at `/architecture/`.

## 5. Kit updates

Bump version in **architecture-kit** and push tag `vX.Y.Z`. This project picks up matching semver on `npm run dev` / `build-dev` automatically.

Local kit development: `export ARCHITECTURE_KIT_LOCAL=1` then `npm run dev`.
