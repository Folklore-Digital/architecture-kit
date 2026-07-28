# Architecture PR checklist

Copy into your PR description or link from your team's PR template.

## Documentation

- [ ] Architecture impact considered (integrations, deploy, folder structure, env vars)
- [ ] Updated `docs/architecture/` when system shape changed
- [ ] Added ADR in `docs/adr/` for significant decisions
- [ ] Updated Mermaid diagrams if data flow or boundaries changed
- [ ] Ran `npx architecture-kit validate` locally (or CI passed)

## Optional (when applicable)

- [ ] Storybook updated (UI components) — link from `documentation-map.md`, not duplicated in architecture docs
- [ ] `.env.example` changes reflected in `environments.md`

## AI-assisted PRs

If an agent wrote the code, confirm it read `docs/architecture/ai-context.md` and did not invent integrations or env vars without docs.
