# Research: Refactor & Harden Name List App

Date: 2025-10-10  
Spec: ../spec.md

## Summary

Determine approaches for sorting, pagination, accessibility, and performance that meet the spec and Constitution.

## Sorting

- Client-side sorting for current scope: A→Z/Z→A by name (locale-aware), newest/oldest by `created_at`.
- Keep API compatible: may add `by` and `order` query params later without breaking clients.

## Pagination

- Default page size: 20 entries.
- Adaptive: compute max rows to fit viewport; reduce page size to avoid vertical overflow of the list component.
- Provide simple pager controls.

## Accessibility

- Input has label; buttons have accessible names.
- Announce errors/success via ARIA live region.
- Maintain visible focus; support Enter to submit.

## Performance

- Target: initial render ≤ 1s; add/remove visible update ≤ 1s.
- Measure with simple timestamps and Lighthouse.

## Open Questions (tracked)

- None; clarifications resolved in spec.
