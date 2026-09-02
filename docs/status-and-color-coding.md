# Status & color coding (docs site)

The static docs site (`architecture-kit build` / `dev`) uses YAML frontmatter `status` to show page maturity. This is **presentation + optional CI**, not a separate CMS.

## Status values

| `status` in frontmatter | Sidebar | Banner | `validate --ci` (default governance) |
| --- | --- | --- | --- |
| *(omit)* / `active` / `current` / `reviewed` | Normal | None | OK |
| `scaffold` | Amber · scaffold | “Scaffold template — not reviewed” | **Fails** until removed + `documentationStatus: active` |
| `draft` / `in-progress` / `in_progress` / `stale` | Amber italic · in progress | “In progress — not complete” | Does **not** fail like scaffold |
| Unknown values | Treated as reviewed | None | OK |

Example:

```yaml
---
status: in-progress
navGroup: Start here
navOrder: 1
---
```

## What the colors mean (for readers)

- **Scaffold (gold/amber, “scaffold”)** — Still the generic template from `init`. Do not trust product details until someone rewrites it and drops `status: scaffold`.
- **In progress (gold/amber, italic, “in progress”)** — Real project content, unfinished or stale. Prefer Start here / overview until it is cleaned up.
- **Normal** — Current architecture doc for this repo.

## Folders the site skips

| Path | Behavior |
| --- | --- |
| `docs/_archive/` | Not listed, not built into the site (frozen snapshots) |
| Dot-directories under `docs/` | Skipped |

Keep `_archive` for historical files; update links first so `validate` stays green.

## Project-level flag

In `architecture.config.json`:

```json
"project": {
  "documentationStatus": "scaffold" | "active"
}
```

Use `"active"` only when scaffold templates are gone (or intentionally none remain). Draft/in-progress pages may still exist under an active project.

## Related

- Root README [Validation](../README.md#validation)
- Help page on the docs site (same rules, browsable)
