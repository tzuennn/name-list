<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Modified principles: N/A (new) →
	I. Code Quality Discipline
	II. Testing Standards and Coverage
	III. User Experience Consistency
	IV. Performance and Efficiency Requirements
- Added sections: Additional Constraints; Development Workflow & Quality Gates
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (Constitution Check gates)
	✅ .specify/templates/tasks-template.md (tests now REQUIRED, perf/UX tasks)
	✅ .specify/templates/spec-template.md (explicit UX/perf acceptance prompts)
	✅ .specify/memory/constitution.md (this file)
	⚠️ .specify/templates/agent-file-template.md (no change needed now)
	⚠️ .specify/templates/checklist-template.md (generic; no change needed)
- Follow-up TODOs: None
-->

# Name List Constitution

## Core Principles

### I. Code Quality Discipline

- All code MUST be readable, maintainable, and consistently formatted.
	- Python: black + isort formatting; flake8 or ruff lint clean (no errors).
	- JavaScript: Prettier formatting; ESLint error-free with project rules.
	- Type usage: Python type hints for new/modified functions; JS/TS prefers
		TS or JSDoc types where applicable.
- Complexity limits: functions aim for Cyclomatic Complexity ≤ 10; larger
	units MUST be refactored or explicitly justified in the plan.
- Dead code and duplication are NOT allowed; identical logic must be extracted
	and reused.
- Public interfaces MUST include docstrings/comments explaining purpose,
	inputs, outputs, and failure modes.

Rationale: Consistent, low-complexity code reduces defects, speeds reviews,
and simplifies onboarding.

### II. Testing Standards and Coverage

- Tests are NON-NEGOTIABLE for all new code paths and bug fixes.
- Minimum coverage: 80% total lines, 90% on critical paths (API handlers,
	core business logic). Coverage deltas MUST not decrease without an approved
	exception noted in the plan.
- Test types required:
	- Unit tests for pure logic.
	- Contract/integration tests for HTTP endpoints and DB interactions.
	- Regression tests for every fixed bug reproducer.
- Tests MUST be deterministic, isolated, and fast; network and time
	dependencies are mocked unless the test is explicitly integration.
- CI gate: tests must pass and meet coverage thresholds before merge.

Rationale: Verified behavior protects velocity and prevents regressions.

### III. User Experience Consistency

- UI components and flows MUST present consistent states: loading, empty,
	error, and success. Each view defines these states explicitly in specs.
- Accessibility: adhere to WCAG 2.1 AA for semantics, contrast, focus order,
	and keyboard operability.
- Content: consistent terminology and tone; user-facing strings centralized
	for reuse and translation readiness.
- Responsiveness: layouts support common breakpoints; no horizontal scrolling
	on mobile; clickable targets ≥ 44x44 px.
- Error handling: actionable messages with next steps; do not expose raw
	stack traces to end users.

Rationale: Consistency reduces cognitive load and improves task success rate.

### IV. Performance and Efficiency Requirements

- Backend API targets (local/dev baseline):
	- p95 latency ≤ 250 ms per request under light load.
	- Database queries p95 ≤ 50 ms; N+1 patterns MUST be eliminated.
	- Memory leaks are unacceptable; long-running services show stable RSS over
		15 minutes of steady traffic.
- Frontend targets:
	- Lighthouse Performance ≥ 90 on a cold load.
	- Initial JS payload (gzip) ≤ 200 KB unless justified in plan.
	- Perceptual responsiveness: first input delay effectively negligible
		(interaction ready within 100 ms on dev hardware).

Rationale: Performance is a feature

## Additional Constraints

- Dependencies MUST be pinned and reviewed; avoid unnecessary additions.
- Secrets MUST never be committed; use environment variables and .env.example
	for scaffolding.
- Logging: structured logs with levels; no PII in logs.
- Observability: errors are surfaced with actionable context

## Development Workflow & Quality Gates

- Branching: feature branches named `<issue-or-id>-feature-name`.
- Reviews: at least 1 reviewer; reviewers MUST check constitution compliance.
- CI gates (blocking):
	1) Lint/format check pass.
	2) Tests pass with coverage thresholds.
	3) UX states and accessibility acceptance criteria present in spec and, when
		 applicable, verified by tests/screenshots.

## Governance

- This Constitution supersedes other style guides where conflicts occur.
- Amendments:
	- Propose a PR updating this document with a Sync Impact Report.
	- Determine semantic version bump: MAJOR for breaking governance changes,
		MINOR for new sections/principles, PATCH for clarifications.
	- On approval, update dependent templates and record Last Amended date.
- Compliance Review: Periodic review each release to ensure adherence; repeat
	violations require remediation tasks before new feature work proceeds.

**Version**: 1.0.0 | **Ratified**: 2025-10-10 | **Last Amended**: 2025-10-10