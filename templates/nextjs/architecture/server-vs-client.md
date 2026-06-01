# Server vs Client Components

## Purpose

Define when to use Server Components vs Client Components in this project.

## Rules

- Prefer Server Components unless browser APIs, local state, or event handlers are required
- Document reasons for new Client Components when governance is enabled

## Common Client Component Cases

- Forms with local state
- Browser-only APIs
- Third-party widgets requiring `window`

## Change Rules

Update when component boundary conventions change.
