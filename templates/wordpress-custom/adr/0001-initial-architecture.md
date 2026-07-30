# ADR 0001: Initial Architecture

## Status

Accepted

## Context

What problem are we solving? Why does this project need an architecture documentation standard?

## Decision

We adopted `@folklore-digital/architecture-kit` to keep architecture documentation close to the code, with Markdown docs, Mermaid diagrams, and ADRs.

## Consequences

### Positive

- One obvious place for architecture context
- Docs can be reviewed in PRs alongside code
- AI tools have a stable source of truth

### Negative

- Requires discipline to keep docs updated
- Validation rules will grow over time

## Related Docs

- /docs/architecture/overview.md
- /docs/architecture/integrations.md
