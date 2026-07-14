# Component Conventions

## Purpose

Define how UI components are composed so new work stays consistent. Deviations should be intentional and documented.

## Design system / shared components

| Pattern | Location | Use when |
| --- | --- | --- |
| _Example: Button_ | _src/components/ui/Button_ | _All primary actions_ |

## Rules

- Prefer shared components over one-off markup for repeated patterns (buttons, cards, form fields).
- New custom variants require a note in this doc or an ADR if they establish a new pattern.
- Document the canonical import path for each shared component.

## Checking conventions

List manual review steps or lint rules that catch drift (e.g. custom `<button>` instead of shared `Button`).

## Change Rules

Update when adding a shared component, changing the design system, or adding automated convention checks.
