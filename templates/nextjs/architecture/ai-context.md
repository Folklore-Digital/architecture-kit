# AI Context

## Project Summary

This is a Next.js App Router project. Update with CMS, hosting, and key integrations.

## Important Rules

- Prefer Server Components unless client interactivity is required
- Do not add third-party scripts without updating integrations and load-order docs
- Do not add environment variables without updating environments.md
- Use existing data models and schemas when possible
- Keep CMS content model changes documented
- For spec-driven work: read ticket spec (if any) → this file → relevant architecture doc → code

## Source of Truth

- Documentation layers: [documentation-map.md](./documentation-map.md)
- Architecture config: `architecture.config.json`
- Architecture docs: `docs/architecture/`
- ADRs: `docs/adr`
- App routes: `src/app` or `/app`

## Files to Treat Carefully

- `middleware.ts`
- Root `layout.tsx`
- CMS client / data layer in `/lib`
