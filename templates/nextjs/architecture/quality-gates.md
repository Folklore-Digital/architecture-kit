# Quality Gates

## Purpose

Document automated checks every change should pass before merge.

## Local commands

| Command | What it checks |
| --- | --- |
| _TBD_ | _e.g. npm run lint_ |
| _TBD_ | _e.g. npm run test_ |
| `npx architecture-kit validate` | Architecture docs structure and governance |

## CI / pre-commit

Describe CI workflow and pre-commit hooks (Husky, lint-staged, etc.).

## Architecture validation

```bash
npx architecture-kit validate --ci
```

Fails on errors; use in pull request checks.

## Change Rules

Update when adding scripts, CI jobs, or required test suites.
