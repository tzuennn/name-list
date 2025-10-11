# UI States Contract: Name List

Date: 2025-10-10  
Spec: ../spec.md

## States

- Loading: Placeholder/skeleton visible; list region reserved.
- Empty: Message "No names yet" with guidance to add; input focused.
- Error: Human-readable message with retry guidance; announced via live region.
- Success: New name visible; input cleared; subtle confirmation; focus managed.

## Sorting Controls

- Name A→Z / Z→A toggle
- Date Newest / Oldest toggle
- Active state is visually indicated and accessible via keyboard

## Pagination

- Default page size 20; adapt to viewport height to avoid vertical overflow.
- Pager controls with clear labels; keyboard accessible and screen-reader friendly.
