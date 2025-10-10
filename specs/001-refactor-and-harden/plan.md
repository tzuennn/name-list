# Implementation Plan: Refactor & Harden Name List App

**Branch**: `001-refactor-and-harden` | **Date**: 2025-10-10 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/001-refactor-and-harden/spec.md`

## Summary

Refactor and harden the 3-tier Name List app to open‑source quality using Spec‑Driven Development. Core capabilities: add/remove names, persistence across sessions, default ordering by time added, and sorting by name (A→Z/Z→A) and by added date (newest/oldest). Duplicates are allowed; list scope is per-user device; pagination defaults to 20 and adapts to viewport to avoid vertical overflow.

## Technical Context

**Language/Version**: Python 3.12 (backend), Nginx static frontend (HTML/CSS/JS)
**Primary Dependencies**: Flask 3.0.3, gunicorn 22.0.0, psycopg2-binary 2.9.9
**Storage**: PostgreSQL 16 (Dockerized) with `names(id, name, created_at)`
**Testing**: pytest (backend), simple browser/contract tests for frontend; coverage enforced per Constitution
**Target Platform**: Docker Compose (db, backend, frontend) on macOS dev; containerized runtime
**Project Type**: Web application (frontend + backend + db)
**Performance Goals**: p95 API ≤ 250 ms; frontend Lighthouse ≥ 90; initial list visible ≤ 1s; add/remove visible update ≤ 1s
**Constraints**: WCAG 2.1 AA; per-user device list; pagination adapts to viewport; duplicates allowed
**Scale/Scope**: Up to thousands of entries; UX enforces page size for viewport fit

## Constitution Check

GATE (must satisfy before Phase 0 research):

- Code Quality
  - Formatter + Linter: Python (black, isort, ruff), JS (Prettier, ESLint). Commit hooks planned.
  - Complexity hotspots: backend route handlers; refactor into services/helpers if cyclomatic complexity > 10.
- Testing
  - Required tests: unit (validation, sorting utilities), contract/integration (API CRUD, DB), regression (bugfixes).
  - Coverage targets: ≥80% overall; ≥90% critical paths (API handlers, DB queries). Network/time mocked in unit tests.
- User Experience
  - States: loading, empty, error, success explicitly represented in UI with ARIA/live regions.
  - Accessibility: WCAG 2.1 AA keyboard flow, focus management, contrast and labels; validation via audit.
- Performance
  - Measurement: simple timings for API latency; Lighthouse for frontend; detect regressions via budget assertions.

## Project Structure

### Documentation (this feature)

```
specs/001-refactor-and-harden/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API + UI state contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```
backend/
├── app.py
├── Dockerfile
└── requirements.txt

frontend/
├── html/
│   ├── index.html
│   └── app.js
├── nginx.conf
└── Dockerfile

db/
└── init.sql

docker-compose.yml
```

**Structure Decision**: Web application with `backend` (Flask API), `frontend` (Nginx static site), `db` (PostgreSQL). Tests will be added under `backend/tests/{unit,integration,contract}` and `frontend/tests` (contract/smoke).

## Phase 0: Research

- Confirm sorting requirements: A→Z/Z→A (locale-aware), newest-first/oldest-first using `created_at`.
- Decide frontend sorting implementation (client-side vs server query params). Default: client-side for current scope; keep server JSON stable ordered by id.
- Accessibility choices: labels, focus, and live regions for success/error; keyboard support for add/remove and sorting controls.
- Pagination strategy: client-side paging with adaptive page size to avoid overflow; compute page size on load/resize.

Deliverable: `research.md` summarizing decisions and trade-offs.

## Phase 1: Design

Artifacts to produce:

- `data-model.md`: DB schema already present (`names`); define API response shapes (`id`, `name`, `created_at`).
- `contracts/`:
  - `api-names.json`: contract for GET/POST/DELETE payloads and status codes.
  - `ui-states.md`: definitions for loading/empty/error/success visuals and a11y.
- `quickstart.md`: local dev steps and feature usage scenarios.

Key design notes:

- Backend: add optional query params for server-side sorting later without breaking current clients.
- Frontend: implement sorting toggles and client-side sort function (localeCompare with sensitivity options). Add adaptive pagination that respects viewport height.

## Phase 2: Implementation & Tests

Backend:
- Add GET `/api/names` support for `order` and `by` query params (non-breaking, optional): `by=name|created_at`, `order=asc|desc`.
- Validate inputs and ensure SQL uses proper ordering with safe parameters.
- Unit tests for validation and sorting query param handling.
- Integration/contract tests for list/add/delete flows.

Frontend:
- Sorting UI: toggles for A→Z/Z→A and newest/oldest.
- Adaptive pagination: compute page size (default 20; reduce if list would exceed viewport height) and controls for page navigation.
- Accessibility: labels for input/button; focus management; error/success announcements.
- Contract tests: verify UI states and ordering.

Performance:
- Measure p95 API latency on dev; ensure add/remove updates within 1s.
- Lighthouse audit ≥ 90 for performance/accessibility.

## Phase 3: Polish & Hardening

- Error copy review; consistent terminology.
- Empty/Loading/Error visual refinements.
- Defensive coding for network glitches (retry messaging).
- Final a11y sweep; keyboard-only usage validated.
- Docs: README sections in quickstart; note pagination viewport behavior.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Client-side sorting & paging | Keeps API simple for now | Server-side sorting/paging adds API complexity prematurely |

## Risks & Mitigations

- Locale sorting surprises for Unicode: use locale-aware comparison and document behavior.
- Viewport-fit pagination complexity: encapsulate sizing logic and test common breakpoints.
- Potential DB N+1 or heavy queries if server sorting later: plan safe ORDER BY columns and indexes.

## Acceptance & Validation

- All Constitution gates satisfied (lint/format, tests with coverage, a11y states, performance budgets).
- Spec success criteria SC-001…SC-007 met in validation passes.
