# Skill: implement-backend-feature

## Purpose

Implement a backend feature safely and consistently, in full conformance with repository architecture, domain rules, API conventions, and security requirements. This skill governs all backend work inside `backend/`.

---

## When to Use

- Any time a backend feature, endpoint, model change, or business rule change is required
- When adding, modifying, or removing API behavior
- When changing validation, permissions, or data constraints

---

## Required Inputs

- A clear description of the feature or change to implement

---

## Execution Steps

Execute every step in order. Do not skip steps.

### Step 1 — Run map-repo

Before writing any code, execute the `map-repo` skill for this task.

The output of `map-repo` must be complete before continuing. Do not proceed without a confirmed list of affected files, applicable invariants, and API contract impact.

### Step 2 — Identify affected domain entities

From the task description and `map-repo` output, name every domain entity involved:
- FeatureRequest
- Vote
- User
- Status
- Category

For each entity, confirm its canonical definition in `docs/engineering/backend/data-modeling.md`. Do not assume field names, types, or constraints — read them.

### Step 3 — Read required documents

Read the following documents in order. Do not skip any.

1. `docs/architecture/backend-architecture.md` — layer responsibilities: transport (views), application (services), query (selectors), domain (models). Confirm where the new logic belongs before writing it.
2. `docs/engineering/backend/data-modeling.md` — field definitions, length constraints, uniqueness rules, `on_delete` directives, access control per entity.
3. `docs/domain/voting-rules.md` — read this whenever the feature involves voting, ranking, vote counts, or `rate`. This document governs all vote-related behavior.
4. `docs/engineering/backend/api-conventions.md` — response envelope, HTTP status codes, error format, pagination, sort parameters, prohibited response shapes.
5. `docs/engineering/backend/security.md` — authentication requirements, object-level permission rules, protected fields, input validation requirements.
6. `docs/engineering/global/testing-strategy.md` — what must be tested, test naming format, mandatory coverage before merge.

If the feature touches domain semantics (voting, ranking, status transitions, user roles), also read:
- `docs/domain/feature-voting.md`

### Step 4 — Identify constraints and invariants

Before writing any code, list explicitly:

**From `docs/domain/voting-rules.md` and `docs/domain/feature-voting.md`:**
- Which voting rules apply to this feature
- Which ranking rules apply
- Which status transition rules apply (if any)

**From `docs/engineering/backend/security.md`:**
- Which fields are protected (never writable from client): `author_id`, `vote_count`, `status_id` (non-admin)
- Which endpoints require authentication
- Which operations require object-level permission checks

**From `docs/engineering/backend/data-modeling.md`:**
- Which uniqueness constraints apply
- Which `on_delete` behaviors apply
- Which access control rules apply per entity

Do not proceed until this list is written out.

### Step 5 — Define API changes (if needed)

If the feature adds, modifies, or removes any endpoint, field, or response shape:

1. Write out the full proposed contract change:
   - HTTP method and URL
   - Request body shape (field names, types, required/optional)
   - Response shape (conforming to the envelope in `docs/engineering/backend/api-conventions.md`)
   - HTTP status codes for success and each failure case
   - Error codes for each failure case

2. Verify the proposed contract against `docs/engineering/backend/api-conventions.md`. Every field, envelope, and status code must comply.

3. If the contract change affects the frontend, stop. Surface the change and defer to `architect` before implementing.

Do not implement any API shape that is not explicitly defined in the docs or agreed upon in this step.

### Step 6 — Determine layer placement

For each piece of logic in the feature, confirm where it belongs:

| Logic type | Layer |
|---|---|
| Field definition, DB constraint, relationship | Model |
| Input validation, response shaping | Serializer |
| Business workflow, multi-step mutation | Service |
| Complex read, annotation, ordering | Selector |
| Auth check, permission dispatch, response return | View / ViewSet |

Record the placement for each piece before writing code.

### Step 7 — Name required tests

Before writing implementation code, name every test case that must exist:

- Happy path: the intended behavior works correctly
- Negative path: invalid input, constraint violations, missing fields
- Permission checks: unauthenticated returns `401`, unauthorized returns `403`
- Invariant enforcement: each constraint named in Step 4 has a corresponding test

Use the naming format: `test_<actor>_<action>_<expected_outcome>`
Example: `test_user_cannot_vote_twice_for_same_feature`

Do not write implementation code until this list is complete.

### Step 8 — Implement models (if needed)

Write or modify model code only if the feature requires new fields, new entities, or constraint changes.

Requirements:
- Field types and constraints must match `docs/engineering/backend/data-modeling.md` exactly
- All `on_delete` behaviors must match the doc
- Unique constraints must be enforced at the DB level (not just application layer)
- Business workflow logic must not live in model methods
- Authorization logic must not live in models

Create a migration for every model change.

### Step 9 — Implement serializers

Write serializers that:
- Validate all input fields per `docs/engineering/backend/data-modeling.md`
- Never expose `password`, auth tokens, or raw DB error details
- Never accept `author_id`, `vote_count`, or `status_id` (non-admin) as writable fields
- Use separate serializers for read and write when the shapes differ significantly
- Shape output in conformance with `docs/engineering/backend/api-conventions.md`

Serializers must not contain business workflow logic. Input validation only.

### Step 10 — Implement services

Write service functions for all non-trivial mutation workflows.

Requirements:
- Services own: feature request creation and edit, vote creation, vote removal, status transitions
- Services must not import from views or depend on HTTP request objects where avoidable
- Wrap multi-write operations in `django.db.transaction.atomic()`
- Vote creation must check for existing vote before `Vote.objects.create()` (application-layer guard)
- Catch `IntegrityError` from concurrent duplicate inserts on vote; return current state, not an error
- Duplicate vote → return current state with `200 OK` (never raise, never return `409`)
- Missing vote on unvote → return current state with `200 OK` (never raise `404`)

### Step 11 — Implement selectors

Write selector functions for all complex reads.

Requirements:
- Selectors are read-only; they must not mutate state
- All `vote_count` computation uses `Count('votes')` annotation — never stored, never computed in Python
- All `has_voted` computation uses annotation against the authenticated user — never computed in the serializer
- Feature list ordering is always: `vote_count DESC, created_at DESC, id DESC` — applied in the selector, not in the view
- `rate` must never appear in any `order_by()` call

### Step 12 — Implement views

Write view or viewset code that:
- Authenticates the request
- Checks permissions via explicit permission classes
- Calls serializers for input validation
- Calls services for mutations
- Calls selectors for reads
- Returns responses conforming to `docs/engineering/backend/api-conventions.md`

Views must not contain:
- ORM queries or queryset construction (belongs in selectors)
- Business workflow logic (belongs in services)
- Ranking logic (belongs in selectors)

Vote endpoints: `POST /api/features/{id}/vote/` and `DELETE /api/features/{id}/vote/`

### Step 13 — Implement permissions

Write permission classes for every sensitive endpoint.

Requirements:
- Every new write endpoint has an explicit permission class
- Object-level checks are required for: edit feature request, delete feature request, change status
- Status changes require `is_admin = True` on the user — this is never derived from a request body field
- Non-admin status change requests return `403 Forbidden`

### Step 14 — Write tests

Write all tests named in Step 7.

Requirements from `docs/engineering/global/testing-strategy.md`:
- Vote uniqueness: duplicate vote does not create a second record
- Vote idempotency: repeated vote returns `200` with unchanged state
- Unvote idempotency: unvote with no existing vote returns `200`
- Admin-only status changes: non-admin gets `403`
- Ranking correctness: `vote_count DESC` ordering is applied; `rate` does not affect order
- Protected field integrity: `author_id` and `vote_count` cannot be client-supplied
- Input validation: invalid fields, missing required fields, invalid references

No implementation is complete without these tests passing.

---

## Expected Output

- Implemented and passing code for all affected layers (models, serializers, services, selectors, views, permissions)
- Migrations for any model changes
- Tests covering happy paths, negative paths, and permission checks
- A brief explanation of each decision: where logic was placed and why, which constraints were enforced and how

---

## Failure Conditions

Stop and surface the issue if any of the following occur:

- The task requires behavior that contradicts a documented invariant — do not implement a workaround; surface the conflict
- The API contract must change and the frontend is a consumer — stop, define the contract, defer to `architect`
- A required document does not exist — report the gap, do not assume content
- A uniqueness constraint or protected field rule from the docs would be violated by the implementation — fix before continuing
- Tests for invariant-enforcing behavior cannot be written — do not ship without them

---

## References

- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/agents/backend-engineer.md`
- `.claude/skills/map-repo/SKILL.md`
