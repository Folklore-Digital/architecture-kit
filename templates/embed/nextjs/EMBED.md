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

Must match `ARCHITECTURE_MOUNT` in `scripts/embed-architecture-site.mjs`.

## 2. Gitignore built docs (optional)

```
/public/architecture/
```

Built output is regenerated on `npm run dev` / `build-dev`.

## 3. Deploy command

Use `npm run build-dev` (not plain `next build`) so docs are embedded at `/architecture/`.

## 4. Kit updates

Bump version in **architecture-kit** and push tag `vX.Y.Z`. This project picks up matching semver on `npm run dev` / `build-dev` automatically.

Local kit development: `export ARCHITECTURE_KIT_LOCAL=1` then `npm run dev`.
