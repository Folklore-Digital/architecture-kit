# Environments

## Purpose

Document environment URLs and Next.js environment variables.

## Environment Matrix

| Environment | URL | Branch | Notes |
| --- | --- | --- | --- |
| Local | `http://localhost:3000` | — | `pnpm dev` |
| Preview | _TBD_ | PR branches | |
| Production | _TBD_ | `main` | Live site |

## Environment Variables

| Variable | Public | Required | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_*` | Yes | _TBD_ | Client-exposed vars |
| _SERVER_ONLY_ | No | _TBD_ | Server-only secrets |

## Change Rules

Any new `NEXT_PUBLIC_` or server env var must be documented here.
