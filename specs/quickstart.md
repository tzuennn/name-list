# Quickstart: Refactor & Harden Name List App

Date: 2025-10-10  
Spec: ../spec.md

## What you'll do

- Add/remove names
- Sort by name and by added date
- Experience pagination that adapts to the viewport

## Scenarios to try

1. Add two names and reload; confirm persistence and ordering.
2. Remove one name; confirm empty state when applicable.
3. Toggle A→Z / Z→A; verify visual order.
4. Toggle newest/oldest; verify order.
5. Resize window; ensure pagination adapts to avoid vertical overflow.

## Validation

- Meets success criteria SC-001…SC-007
- A11y keyboard-only flow works; audit score ≥ 90
- Performance timings are within budgets
