---
description: "Task list for implementing 'Refactor & Harden Name List App'"
---

# Tasks: Refactor & Harden Name List App

**Input**: Design documents from `/specs/001-refactor-and-harden/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED per the Constitution. Include unit tests for logic, contract/integration tests for endpoints/DB, and regression tests for bug fixes. Coverage targets: ≥80% overall, ≥90% critical paths.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and quality tooling

- [x] T001 [P] Configure Python formatting (black) and import sorting (isort) — add `pyproject.toml` at repo root
- [x] T002 [P] Configure Python linting (ruff) with rules aligned to Constitution — add to `pyproject.toml`
- [x] T003 [P] Configure pytest and coverage thresholds (80% overall, 90% critical) — create `backend/tests/` scaffolding and `backend/pytest.ini`
- [x] T004 [P] Configure JS formatting (Prettier) and linting (ESLint) — add `.prettierrc`, `.eslintrc.json` in `frontend/`
- [x] T005 Create `.env.example` with DB vars (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) — repo root
- [x] T006 Document Constitution gates in `specs/001-refactor-and-harden/quickstart.md` validation section (lint, tests, a11y, performance)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Ensure DB schema present and loaded via `db/init.sql` (table `names`) — verify constraints documented in `data-model.md`
- [x] T011 [P] Backend test scaffolding: create `backend/tests/unit/`, `backend/tests/integration/`, `backend/tests/contract/` with empty `__init__.py`
- [x] T012 [P] Add a11y live region container to `frontend/html/index.html` (e.g., `<div id="live" aria-live="polite" class="sr-only"></div>`) and minimal SR-only styles
- [x] T013 Add basic timing helpers in `frontend/html/app.js` for measuring render/update timing (non-invasive)
- [x] T014 [P] Add structured error message helper in `frontend/html/app.js` and ensure no stack traces leak to users
- [x] T015 Define performance budgets in `specs/001-refactor-and-harden/plan.md` (confirmed) and link measurement approach in `research.md` (confirmed)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Add & Persist (Priority: P1) 🎯 MVP

**Goal**: Add names and see them persist across sessions; default order by time added (oldest→newest)

**Independent Test**: Add "Alice" then "Bob"; verify ["Alice","Bob"] order and persistence after reload; blank input rejected with message

### Tests for User Story 1 (REQUIRED) ⚠️

- [x] T020 [P] [US1] Unit: backend validation rejects blank and >50 chars — `backend/tests/unit/test_validation.py`
- [x] T021 [P] [US1] Contract: POST /api/names (201, 400) and GET /api/names returns created entries — `backend/tests/contract/test_names_api.py`
- [x] T022 [P] [US1] Integration: add two names; verify order by insertion and persistence after reload (DB roundtrip) — `backend/tests/integration/test_add_persist.py`
- [x] T023 [US1] A11y: verify keyboard submit, focus visible, live region announces success/error (manual or script notes) — `frontend/tests/a11y/US1-notes.md`

### Implementation for User Story 1

- [x] T024 [US1] Backend: ensure GET includes `created_at` and orders by insertion (`id`) — `backend/app.py`
- [x] T025 [US1] Frontend: show Loading, Empty, Error, Success states consistently — `frontend/html/app.js`
- [x] T026 [P] [US1] Frontend: clear input and announce success via live region on add — `frontend/html/app.js`
- [x] T027 [P] [US1] Frontend: prevent empty/whitespace names with inline message and focus handling — `frontend/html/app.js`
- [x] T028 [US1] Frontend: ensure empty state appears when list is empty — `frontend/html/app.js`

**Checkpoint**: US1 complete and testable independently

---

## Phase 4: User Story 2 — Remove a Name (Priority: P2)

**Goal**: Remove a specific name and see accurate list state across sessions

**Independent Test**: Remove first entry; verify persistence and correct list state (including empty state when last removed)

### Tests for User Story 2 (REQUIRED) ⚠️

- [x] T030 [P] [US2] Contract: DELETE /api/names/{id} returns 200; item gone from GET — `backend/tests/contract/test_delete_api.py`
- [x] T031 [P] [US2] Integration: add->delete flow leaves consistent state after reload — `backend/tests/integration/test_remove_flow.py`
- [x] T032 [US2] A11y: verify delete buttons labeled, keyboard accessible, and focus remains sensible — `frontend/tests/a11y/US2-notes.md`

### Implementation for User Story 2

- [x] T033 [US2] Frontend: confirm empty state after last deletion and announce via live region — `frontend/html/app.js`
- [x] T034 [US2] Frontend: ensure delete buttons have accessible names and tooltips — `frontend/html/app.js`, `frontend/html/index.html`

**Checkpoint**: US1 and US2 both independently complete

---

## Phase 5: User Story 3 — Sorting & Pagination (Priority: P3)

**Goal**: Sort by A→Z/Z→A and newest/oldest; paginate with default 20 entries per page, adapting to viewport to avoid overflow

**Independent Test**: Toggle each sort mode and verify visual order; resize window to ensure pagination adapts; navigate pages

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T040 [P] [US3] Unit: sorting utils (A→Z, Z→A, date newest/oldest) with Unicode cases — `frontend/tests/unit/test_sorting.js`
- [ ] T041 [P] [US3] Integration: UI toggles switch order; pagination applies correctly across viewports — `frontend/tests/integration/test_sort_and_paginate.md`
- [ ] T042 [US3] A11y: sorting controls and pagination are keyboard operable with clear focus and labels — `frontend/tests/a11y/US3-notes.md`

### Implementation for User Story 3

- [ ] T044 [US3] Frontend: add sorting controls UI (A→Z/Z→A, Newest/Oldest) — `frontend/html/index.html`
- [ ] T045 [US3] Frontend: implement sorting function using locale-aware compare and `created_at` — `frontend/html/app.js`
- [ ] T046 [US3] Frontend: implement pagination controls (default 20/page) — `frontend/html/index.html`, `frontend/html/app.js`
- [ ] T047 [US3] Frontend: adaptive page size to prevent vertical overflow (adjust page size on load/resize) — `frontend/html/app.js`
- [ ] T048 [P] [US3] Backend (optional, future-proof): accept `by=name|created_at` and `order=asc|desc` query params in GET (non-breaking) with validation — `backend/app.py`
- [ ] T049 [P] [US3] Contract tests for optional server sorting params — `backend/tests/contract/test_server_sorting.py`

**Checkpoint**: All user stories independently functional; sorting and pagination validated

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T060 [P] Docs: update `quickstart.md` scenarios and screenshots
- [ ] T061 Code cleanup and refactoring; ensure cyclomatic complexity targets
- [ ] T062 [P] Additional unit/integration tests to hit coverage thresholds
- [ ] T063 Accessibility validation sweep (keyboard, contrast, ARIA); address findings
- [ ] T064 Security hardening: input validation review, header checks (frontend proxy), dependency review
- [ ] T065 Run performance checks (API p95, Lighthouse ≥ 90); address regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3..5) → Polish (Final)
- User stories proceed in priority order (P1 → P2 → P3) but can run in parallel once Foundational is complete and if staffing allows.

### User Story Dependencies

- US1: none (after Foundational)
- US2: none (after Foundational); relies on delete flow already present
- US3: none (after Foundational); builds on list rendering

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implement in this order: utilities → UI → integration glue

### Parallel Opportunities

- Setup linters/formatters/tests (T001–T004) can run in parallel
- Foundational a11y/timing/logging tasks (T012–T014) can run in parallel
- US1 tests (T020–T022) can run in parallel; T023 is separate a11y validation
- US3 client sorting (T045) and pagination controls (T046) may proceed in parallel; backend optional params (T048) in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: US1 independent tests pass; persistence confirmed

### Incremental Delivery

1. US1 → test, validate, demo
2. US2 → test, validate, demo
3. US3 → test, validate, demo

---

## Summary & Metrics

- Total tasks: 35
- By story: US1 = 9, US2 = 6, US3 = 10, Setup+Foundational+Polish = 10
- Parallel opportunities: Setup (T001–T004), Foundational (T012–T014), US1 tests (T020–T022), US3 (T045, T046, T048, T049)
- Independent Test Criteria:
  - US1: add & persist across reload; default insertion order; rejects blank
  - US2: remove item; correct state across reload; accessible delete controls
  - US3: correct sort orders; pagination adapts to viewport; keyboard operability

**Suggested MVP Scope**: Complete User Story 1
