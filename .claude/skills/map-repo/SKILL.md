# Skill: map-repo

## Purpose

Build a complete, accurate picture of repository structure, architecture, and relevant documentation before starting any implementation work. This skill prevents incorrect assumptions, missed constraints, and unintended side effects.

---

## When to Use

- Before starting work on any unfamiliar area of the repository
- Before implementing any new feature (backend or frontend)
- Before making structural changes that may affect multiple files or layers
- When asked to diagnose, audit, or extend existing behavior

Do not skip this skill when starting a non-trivial task. It is not optional.

---

## Required Inputs

- A description of the task or feature to be implemented (even if rough)

---

## Execution Steps

Execute every step in order. Do not skip steps.

### Step 1 — Read the system overview

Read `docs/architecture/system-overview.md`.

Extract and record:
- System purpose and actors
- Core domain concepts (FeatureRequest, Vote, User, Status, Category)
- Core flows (feature submission, voting, ranking, status transition)
- System invariants (rules that must never be violated)

### Step 2 — Read domain rules

Read `docs/domain/feature-voting.md`.

Extract and record:
- Feature request lifecycle
- Status transitions and who can trigger them
- Voting rules (one vote per user, idempotency, deactivated users)
- Ranking rules (ordering formula, determinism requirement)
- What the frontend must not enforce that the backend must

Read `docs/domain/voting-rules.md`.

Extract and record:
- Exact vote behavior specification
- Duplicate vote handling
- Concurrent vote handling
- `rate` field restrictions
- Ranking formula: `vote_count DESC → created_at DESC → id DESC`

### Step 3 — Identify which layers are affected

Based on the task description, determine:

- Is this backend-only, frontend-only, or cross-layer?
- Which domain entities are involved?
- Does this change the API contract?

Record the answer to each question explicitly before proceeding.

### Step 4 — Read architecture docs for affected layers

**If backend is involved**, read in order:
1. `docs/architecture/backend-architecture.md` — app structure, layer responsibilities (transport → application → query → domain), component ownership
2. `docs/engineering/backend/data-modeling.md` — entity definitions, field constraints, `on_delete` rules, access control table
3. `docs/engineering/backend/api-conventions.md` — response envelope, status codes, error format, pagination, sort params, prohibited behaviors
4. `docs/engineering/backend/security.md` — authentication, object-level permissions, protected fields

**If frontend is involved**, read in order:
1. `docs/architecture/frontend-architecture.md` — folder structure, component responsibilities, technology constraints, data flow
2. `docs/engineering/frontend/react-standards.md` — component rules, hook design, naming conventions
3. `docs/engineering/frontend/api-consumption.md` — how API calls are made, where they live, forbidden patterns
4. `docs/engineering/frontend/state-management.md` — what state lives where, global vs local state rules
5. `docs/engineering/frontend/ui-ux-guidelines.md` — layout rules, loading/error/empty state requirements

### Step 5 — Locate affected files in the codebase

**For backend tasks:**
- Identify affected app(s) under `backend/`
- Identify affected models, serializers, services, selectors, views, permissions, and URL configs
- List their file paths explicitly

**For frontend tasks:**
- Identify affected feature folder(s) under `frontend/src/`
- Identify affected components, hooks, services, and types
- List their file paths explicitly

**For cross-layer tasks:**
- Complete both sets above
- Identify the API endpoint(s) that will be the integration point

### Step 6 — Check for architectural decisions

Read any relevant files in `docs/decisions/`:
- `ADR-001-monorepo-structure.md`
- `ADR-002-voting-model.md`

Determine whether the planned work touches a decision already recorded. If yes, the implementation must conform to that decision unless a new ADR supersedes it.

### Step 7 — Check existing tests

Locate the test files for the affected modules. Record:
- What is already tested
- What new tests will be required

Backend test location: `backend/` (find test files matching `test_*.py`)
Frontend test location: `frontend/src/` (find test files matching `*.test.tsx` or `*.test.ts`)

---

## Expected Output

Produce a structured map containing all of the following:

1. **Task scope**: which layer(s) are affected
2. **Domain entities involved**: named list
3. **Applicable invariants**: all system invariants from docs that apply
4. **Architecture layer placement**: where each piece of logic will live
5. **Affected files**: full list of files to create or modify, with paths
6. **Relevant docs**: list of all documents read and what they govern
7. **API contract impact**: whether the contract changes and what changes
8. **Test requirements**: list of required test cases (named)

Do not proceed to implementation until this output is complete.

---

## Failure Conditions

Stop and surface the issue if any of the following occur:

- A required document in `docs/` does not exist — do not assume its content; report the gap
- The task requires behavior that contradicts a documented invariant — do not work around it; surface the conflict
- The task touches the API contract but the change has not been defined — do not implement; defer contract definition first
- Files expected by documented architecture do not exist — note their absence before assuming they must be created

---

## References

- `docs/architecture/system-overview.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/decisions/ADR-001-monorepo-structure.md`
- `docs/decisions/ADR-002-voting-model.md`
- `.claude/agents/architect.md`
- `.claude/agents/backend-engineer.md`
