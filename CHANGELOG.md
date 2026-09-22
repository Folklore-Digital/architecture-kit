# Changelog

All notable changes to `@folklore-digital/architecture-kit` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/)-inspired. Versioning: [VERSIONING.md](./VERSIONING.md).

## [Unreleased]

### Added

- (none yet)

## [1.2.1] - 2026-09-22

### Fixed

- Next.js embed template: skip `<script>` / `<style>` when rewriting `href` so site search and other inline JS keep working after mount-path embedding

## [1.2.0] - 2026-09-02

### Added

- Kit handbook under `docs/` — [how it works](./docs/how-it-works.md), [folder structure](./docs/folder-structure.md), [status & color coding](./docs/status-and-color-coding.md), [removal](./docs/removal.md)
- README: **Markdown first** — scan / bootstrap / greenfield prompt are optional accelerators; removing the package leaves Markdown intact
- Doc frontmatter `status: draft` | `in-progress` | `stale` — “in progress” site banner/sidebar; does **not** fail validate like `scaffold`
- Skip `docs/_archive/` (and dot-dirs) when building the docs site
- Pin pages into **Start here** via `navGroup` even outside `docs/architecture/`
- This changelog file

### Documentation

- [VERSIONING.md](./VERSIONING.md) points at CHANGELOG on release

## [1.1.0] - 2026-09

### Added

- Guidance on diagram **files** (`.mmd`) vs **inline** Mermaid blocks in Markdown

### Notes

- Tag `v1.1.0` on `main`. Prefer `.mmd` for shared/canonical diagrams so `validate` can check them.

## [1.0.1] - 2026-08

### Changed

- Docs site: sticky sidebar; full-width main content (removed content max-width constraint)

## [1.0.0] - 2026-08

### Added

- First stable release on **GitHub Packages** as `@folklore-digital/architecture-kit`
- Default host install via registry semver (`^1.0.0`); git+ssh remains a fallback
- Embed templates, validate/doctor, scan/bootstrap, MCP, deploy-safety helpers (promoted from 0.5.x)

### Changed

- npm scope renamed to `@folklore-digital` (from earlier `@folklore` / git-only installs)

## [0.5.x] - 2026

Pre-release **agent-pack** line (`feature/agent-pack` era). Highlights:

- Scaffold mode + CI guards for unreviewed templates
- Agent pack / scan context for AI fill workflows
- MCP stdio server
- Deploy safety and configurable mount paths
- Docs site search, dates, Help page

Superseded by **1.0.0**. See git tags `v0.5.0`–`v0.5.7` and [ROADMAP.md](./ROADMAP.md) for detail.

## [0.4.x] - 2026

Early docs site, nav, Help, link validation. See tags `v0.4.0`–`v0.4.4`.
