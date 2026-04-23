# Skill: review-change

## Purpose

Perform a strict, structured review of any change before it is finalized. Catch architecture violations, domain rule breaches, API contract misalignments, security gaps, missing tests, and anti-patterns. This skill produces a categorized list of issues with required fixes.

---

## When to Use

- Before finalizing any implementation (backend, frontend, or cross-layer)
- When asked to review a diff, a set of files, or a completed feature
- Before declaring any task complete

---

## Required Inputs

- The set of files changed (file paths)
- The feature or task description the change implements

---

## Execution Steps

Execute every step in order. Do not skip steps.

### Step 1 — Establish the scope of change

Read every changed file. Do not review from memory or assumptions.

Record:
- Which layers are affected (backend, frontend, or both)
- Which domain entities are involved
- Whether the API contract changed (any endpoint, field, or response shape added, modified, or removed)
- Whether any migrations were created

### Step 2 — Identify governing documents

Based on the scope, identify every document in `docs/` that governs the changed behavior.

For backend changes, the governing docs are:
- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/domain/voting-rules.md` (if voting, ranking, or vote count is involved)
- `docs/domain/feature-voting.md` (if feature lifecycle or status is involved)
- `docs/engineering/global/testing-strategy.md`

For frontend changes, the governing docs are:
- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/engineering/backend/api-conventions.md` (for contract consumption)

Read each governing document before running the checks below.

### Step 3 — Check architecture compliance

**Backend:**
- Is business logic in services, not views? Flag any workflow logic inside a view.
- Is ORM/queryset logic in selectors, not views? Flag any `.filter()`, `.annotate()`, or `.order_by()` inside a view.
- Is input validation in serializers, not services or views? Flag misplaced validation.
- Is `vote_count` computed via a queryset annotation? Flag any Python-side aggregation (e.g., `len(feature.votes.all())`).
- Does the ranking order match `vote_count DESC, created_at DESC, id DESC` exactly? Flag any deviation.
- Is `rate` absent from all `order_by()` calls? Flag any use of `rate` in ordering.

**Frontend:**
- Are all API calls in service functions? Flag any `fetch` or `axios` inside a component or hook.
- Are presentational components free of data-fetching logic? Flag any direct API calls in components.
- Is business logic absent from components? Flag any vote counting, ranking, or status derivation in frontend code.
- Are all props explicitly typed? Flag any `any` types.
- Are files in the correct folders per `docs/architecture/frontend-architecture.md`? Flag misplaced files.

### Step 4 — Check domain rule adherence

Read `docs/domain/voting-rules.md` and `docs/domain/feature-voting.md`. For each rule, check whether the implementation complies.

Mandatory checks:

| Rule | Check |
|---|---|
| One vote per user per feature | DB unique constraint on `(user_id, feature_request_id)` exists in the migration |
| Duplicate vote → `200 OK`, not `409` | Service returns current state on duplicate, never raises |
| Missing vote on unvote → `200 OK`, not `404` | Service returns current state on missing vote, never raises |
| Concurrent duplicate insert → catch `IntegrityError` | `IntegrityError` is caught; returns `200 OK` |
| `vote_count` never stored on `FeatureRequest` | No `vote_count` field in model or migration |
| `rate` never affects ranking | No `rate` in any `order_by()` |
| `author_id` always from `request.user` | No serializer or view accepts `author_id` from request body in non-admin flow |
| `status_id` not writable by non-admin | Serializer or permission blocks non-admin status writes |
| Status changes are admin-only | Permission class checks `is_admin` for status change endpoints |
| `vote_count` and `has_voted` not computed by frontend | No client-side vote count logic in React code |

Flag every rule that is not enforced by the implementation.

### Step 5 — Check API contract alignment

Read `docs/engineering/backend/api-conventions.md`.

**Backend checks:**
- Does every response use the correct envelope: `{ "data": ..., "meta": ... }`?
- Does every error use the correct format: `{ "error": { "code": str, "message": str, "details": obj | null } }`?
- Does the vote response match exactly: `{ "data": { "feature_request_id": int, "has_voted": bool, "vote_count": int }, "meta": null }`?
- Are all list responses paginated? Flag any unbounded list response.
- Is `sort=rate` or `sort=-rate` rejected with `400`? Flag if not.
- Are correct HTTP status codes used (e.g., `201` for create, `200` for update/vote, `204` for delete, `400` for validation, `401` for unauth, `403` for forbidden, `404` for not found)?

**Frontend checks:**
- Does the frontend unwrap `response.data` from the envelope before using it?
- Does the frontend handle `meta.pagination` for paginated endpoints?
- Does the frontend handle all defined error codes for each endpoint it calls?
- Does the frontend display correct messages for `400`, `401`, `403`, `404` responses?

### Step 6 — Check security implications

Read `docs/engineering/backend/security.md`.

Check:
- Does every new write endpoint require authentication? Flag any unprotected write.
- Does every endpoint that touches another user's data have object-level permission checks?
- Are `password`, auth tokens, and raw DB error messages absent from all API responses?
- Is `author_id` absent from all writable serializer fields in non-admin flows?
- Is `status_id` absent from all writable serializer fields for non-admin users?
- Is `vote_count` absent from all writable serializer fields?
- Are all user-supplied string inputs validated for length and format before persistence?

### Step 7 — Check state management correctness (frontend only)

Read `docs/engineering/frontend/state-management.md`.

Check:
- Is server state (data from the API) managed correctly — not duplicated into component-local state?
- Is UI state (loading, error, open/closed) kept local where it belongs?
- Is global state not used for data that is only needed in one component?
- Does optimistic UI (if any) handle rollback on failure?

### Step 8 — Check for anti-patterns

Check for the following anti-patterns in all changed code:

**Backend anti-patterns:**
- Workflow logic inside serializer `create()` or `update()` methods
- ORM queries inside view methods
- `filter().count()` or `len(queryset)` used where annotation is required
- Catching all exceptions with a bare `except Exception` instead of specific exception types
- Missing `atomic()` for multi-write operations
- Hardcoded user IDs, status names, or category names instead of lookups

**Frontend anti-patterns:**
- `useEffect` used for derived state (compute it inline instead)
- API calls inside render functions or without hooks
- Prop drilling more than two levels deep when a hook would be cleaner
- Hardcoded strings that should be constants or come from the API
- Components that render without handling loading and error states

### Step 9 — Check for missing tests

Read `docs/engineering/global/testing-strategy.md`.

**Backend — mandatory tests that must exist:**
- Happy path for every new endpoint or service function
- Negative path for every validation rule
- Permission test: unauthenticated returns `401`
- Permission test: unauthorized (wrong role or wrong user) returns `403`
- Constraint enforcement: duplicate vote does not create a second record
- Idempotency: repeated vote returns `200`; unvote with no vote returns `200`
- Ranking: `vote_count DESC` order is applied; `rate` does not affect order
- Protected fields: `author_id` and `vote_count` cannot be client-supplied

**Frontend — mandatory tests that must exist:**
- Component renders correctly in loading state
- Component renders correctly in error state
- Component renders correctly in empty state
- Component renders correctly with data
- User interactions trigger correct service calls
- Correct arguments are passed to service functions

Flag every named test category that has no corresponding test in the changed files.

---

## Expected Output

Produce a structured review report with the following sections:

### Issues Found

List every issue found, with:
- **Severity**: `BLOCKER` (must fix before merge), `WARNING` (should fix), or `NOTE` (low priority)
- **Location**: file path and line number (or function name)
- **Description**: what the issue is
- **Rule violated**: which doc or invariant this breaks
- **Required fix**: exactly what must change

### Missing Tests

List every missing test category with:
- **Test name** (using `test_<actor>_<action>_<expected_outcome>` format)
- **What it must verify**
- **Why it is mandatory**

### Summary

- Total BLOCKER count
- Total WARNING count
- Overall verdict: `APPROVED` (no blockers), `APPROVED WITH WARNINGS` (warnings only), or `BLOCKED` (one or more blockers)

A change with any BLOCKER must not be merged until all blockers are resolved.

---

## Failure Conditions

Stop and surface the issue if any of the following occur:

- A governing document cannot be read — do not proceed with the review; report the missing doc
- The changed files cannot be read — report the file access issue
- The change touches both layers but no API contract definition was produced — flag as BLOCKER

---

## References

- `docs/architecture/backend-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/agents/architect.md`
- `.claude/agents/backend-engineer.md`
