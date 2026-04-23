---
name: implement-full-stack-feature
description: Implement a feature spanning both backend and frontend. Backend is completed and verified first. Frontend is implemented against the confirmed contract. No partial states left.
---

# Skill: implement-full-stack-feature

## Purpose

Implement a feature that changes both the backend API and frontend UI — with both layers kept in sync, the contract defined before either layer is touched, and the backend fully verified before frontend work begins.

---

## When to Use

- When a feature requires changes to both `backend/` and `frontend/`
- When a new domain entity or workflow needs both model/endpoint work and UI
- When a domain rule change must be reflected in both layers

If only one layer is affected, use `implement-backend-feature` or `implement-frontend-feature` instead.

---

## Required Inputs

Before starting, confirm:
- A precise description of the feature: what it does, what domain entities it affects, what user-facing behavior it enables
- Clarity on which layer(s) are affected

---

## Step 0 — Run map-repo

Execute the `map-repo` skill before any other step.

Extract and record:
- Every file in `backend/` that is affected
- Every file in `frontend/` that is affected
- Which API endpoints are new or changed
- Whether existing frontend consumers depend on changed endpoints
- Which domain invariants apply

Do not proceed to Step 1 until `map-repo` is complete.

---

## Required Documents — Read Before Acting

**Always read — all of these:**
1. `docs/architecture/system-overview.md` — domain model, system invariants, core flows
2. `docs/domain/feature-voting.md` — domain rules for feature requests, statuses, roles
3. `docs/architecture/backend-architecture.md` — layer responsibilities
4. `docs/engineering/backend/data-modeling.md` — field definitions, constraints, `on_delete`
5. `docs/engineering/backend/api-conventions.md` — the API contract standard. This document is the boundary between layers.
6. `docs/engineering/backend/security.md` — authentication, permissions, protected fields
7. `docs/architecture/frontend-architecture.md` — folder structure, component layer responsibilities
8. `docs/engineering/frontend/api-consumption.md` — service layer, Axios instance, optimistic update procedure
9. `docs/engineering/frontend/state-management.md` — state tiers, ownership rules
10. `docs/engineering/global/testing-strategy.md` — mandatory test coverage

**Read if applicable:**
- `docs/domain/voting-rules.md` — required if vote, `vote_count`, `has_voted`, or ranking is involved

Do not proceed past Step 0 without completing this reading.

---

## Phase 1: Design (Steps 1–3)

No code is written during Phase 1.

### Step 1 — Identify the scope of change

State explicitly:

```
Domain behavior changes: yes/no — <what changes>
API changes: yes/no — <which endpoints are new or changed>
UI changes: yes/no — <which pages, features, components change>
Cross-layer: yes — this skill applies
```

### Step 2 — Design the backend changes

Before defining any frontend impact, produce a complete backend design by running `design-backend-feature`.

The output of `design-backend-feature` must include:
- Affected domain entities and their changes
- Every invariant that applies, traced to a document
- Layer assignments for all new logic
- Named test cases

Do not proceed to Step 3 until `design-backend-feature` is complete.

### Step 3 — Define the API contract

Write the full API contract for every endpoint that is new or changed. This contract is the binding agreement between layers. Both layers implement against it. Neither layer invents behavior not in this contract.

```
Endpoint: <METHOD> <URL>
Authentication: required / not required
Permission class: <name>
Request body:
  <field>: <type>, required / optional
  Forbidden from client: author_id, vote_count, status_id (non-admin) [keep applicable]
Success response:
  HTTP: <status code>
  Body: { "data": <exact shape>, "meta": <pagination or null> }
Failure responses:
  <scenario>: HTTP <code>, { "error": { "code", "message", "details" } }
Idempotency: <describe if applicable>
Frontend impact:
  Consumers: <which pages or features consume this endpoint>
  Fields consumed: <which response fields the frontend will use>
```

**No implementation begins until this contract is written and confirmed.**

---

## Gate — Confirm Phase 1 is complete

Before writing any code:
- [ ] `design-backend-feature` output is complete
- [ ] API contract is written for every changed endpoint
- [ ] Frontend impact is identified
- [ ] No blocking issues remain

---

## Phase 2: Backend Implementation (Steps 4–5)

### Step 4 — Implement the backend

Implement in this order. Apply the corresponding skill for each area.

1. **Models and migrations** — if entity changes are required. Apply `implement-django-models`.
2. **Serializers** — read/write shapes, field exposure, validation. No workflow logic.
3. **Services** — mutation workflows, `transaction.atomic()`, idempotency handling.
4. **Selectors** — `vote_count` annotation (`Count('votes')`), `has_voted` annotation (filtered to authenticated user), ordering (`vote_count DESC, created_at DESC, id DESC`), `select_related` and `prefetch_related`. `rate` never appears in `order_by()`.
5. **Views** — authenticate, check permissions, call serializer, call service or selector, return response. No queryset construction in views.
6. **Permissions** — named permission classes for every new access control requirement.
7. **Tests** — apply `write-backend-tests`. All mandatory tests from Step 2 must be written and passing.

### Step 5 — Verify the backend contract

Before starting frontend work, verify that the actual backend implementation matches the contract from Step 3.

Verify by checking the serializer and running the endpoint:

```
Contract verification:
- [ ] Response envelope: { "data": ..., "meta": ... } ✓
- [ ] Error envelope: { "error": { "code", "message", "details" } } ✓
- [ ] Field names: snake_case ✓
- [ ] vote_count: annotation-derived, not stored ✓
- [ ] has_voted: annotation-derived, filtered to user ✓
- [ ] status: { id, name, color, is_terminal } ✓
- [ ] author: { id, name } — no email ✓
- [ ] rate: not in any order_by() ✓
- [ ] Ordering: vote_count DESC, created_at DESC, id DESC ✓
- [ ] author_id, vote_count, status_id (non-admin): not accepted from client ✓
- [ ] Vote idempotency: POST vote returns 200 whether new or duplicate ✓
- [ ] Unvote idempotency: DELETE vote returns 200 whether exists or not ✓
- [ ] All backend tests passing ✓
```

If any item above is unchecked: fix the backend before proceeding. Do not start frontend work with a broken backend contract.

---

## Phase 3: Frontend Implementation (Steps 6–7)

Frontend implementation begins only after Phase 2 is complete and verified.

### Step 6 — Design the frontend

Run `design-frontend-feature` using the contract from Step 3 as input. The design plan must include:
- Affected pages, features, and components
- API calls with service functions and query keys
- State tier assignments for every piece of state
- Loading, error, and empty states for every async operation
- Component classification (reusable vs feature-local)
- Complete folder and file structure

Do not proceed to Step 7 until `design-frontend-feature` is complete.

### Step 7 — Implement the frontend

Implement in this order:

1. **Types** — TypeScript types matching the contract exactly. `snake_case`. Include `status.is_terminal: boolean`.
2. **Query keys** — define constants. No inline strings.
3. **Service functions** — in the correct `services/` file, using the centralized Axios instance.
4. **Hooks** — `useQuery` for reads, `useMutation` for mutations. Vote/unvote use the full optimistic update pattern (snapshot → estimate → overwrite from `VoteResponse` → rollback on error).
5. **Components** — apply `create-component`. No API calls inside components.
6. **Pages** — assemble features. No inline data fetching.
7. **Async states** — loading, error, and empty handled for every async operation.
8. **Route guards** — protected pages redirect before rendering.

Apply `connect-to-api` for each API integration point.

---

## Phase 4: Verification (Step 8)

### Step 8 — Verify no backend/frontend mismatch remains

```
Cross-layer verification:
- [ ] Every field the frontend reads is in the backend response ✓
- [ ] Every response field the UI must display is rendered ✓
- [ ] Field names are snake_case in both the API and frontend types ✓
- [ ] status type includes is_terminal ✓
- [ ] vote_count and has_voted not computed locally ✓
- [ ] Feature list not sorted on the client ✓
- [ ] 401 responses redirect to /login ✓
- [ ] 403 responses display permission-denied message ✓
- [ ] 400 responses surface error.details at the field level ✓
- [ ] author_id and status_id absent from non-admin form payloads ✓
- [ ] Vote/unvote use full optimistic update with rollback ✓
- [ ] All other mutations use invalidate-and-refetch ✓
- [ ] All backend tests passing ✓
```

### Step 9 — Identify and apply doc updates

Check whether any documentation must be updated:

```
Doc updates required:
- docs/engineering/backend/api-conventions.md: yes/no — <what changed>
- docs/domain/feature-voting.md: yes/no — <what changed>
- docs/domain/voting-rules.md: yes/no — <what changed>
- Other: <file>: yes/no — <what changed>
```

If documentation is required: update it now. Do not leave implementation and docs misaligned.

---

## Expected Output

- Complete backend: models, serializers, services, selectors, views, permissions, migrations, tests
- Complete frontend: types, query keys, services, hooks, components, pages
- All backend tests passing
- Cross-layer verification checklist completed
- Doc updates applied

---

## Failure Conditions

Stop immediately if:
- The API contract cannot be defined before implementation begins — write `BLOCKED: no contract`
- The backend implementation contradicts a documented domain invariant — fix before starting frontend
- The frontend requires computing `vote_count`, `has_voted`, or ranking locally — write `FORBIDDEN:`
- Backend verification (Step 5) fails — do not proceed to frontend implementation
- A cross-layer mismatch is found in Step 8 — fix both layers; do not leave one out of sync

---

## Anti-Patterns — Forbidden

- Starting frontend implementation before the backend contract is defined (Step 3)
- Starting frontend implementation before the backend passes verification (Step 5)
- Computing `vote_count`, `has_voted`, or ranking in the frontend
- Sorting or reordering the feature list on the client
- Accepting `author_id`, `vote_count`, or `status_id` (non-admin) from the client
- Returning `409 Conflict` for duplicate votes
- Storing server state in `useState` or Context
- Inline query key strings inside hook calls
- Leaving the system in a partial state (one layer done, other not)
- Skipping doc updates when implementation changes what a doc describes

---

## References

- `docs/architecture/system-overview.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/rules/backend-rules.md`
- `.claude/rules/frontend-rules.md`
- `.claude/skills/design-backend-feature/SKILL.md`
- `.claude/skills/design-frontend-feature/SKILL.md`
- `.claude/skills/implement-backend-feature/SKILL.md`
- `.claude/skills/implement-frontend-feature/SKILL.md`
- `.claude/skills/map-repo/SKILL.md`
