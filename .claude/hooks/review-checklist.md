# Review Checklist Hook

## Trigger

Run when reviewing any implemented change — planned or already written. This checklist is mandatory for code review, self-review before declaring work complete, and any reviewer agent invocation.

Severity levels used throughout:
- **Critical** — violates a system invariant, breaks the API contract, introduces a security gap, or leaves a critical rule unenforced. The change must not merge until resolved.
- **Major** — a missing test, an unhandled state, or an architectural deviation that must be corrected before merge.
- **Minor** — a pattern that should be improved but does not block merge if time is not available. Rare. Most findings should be Critical or Major.

---

## Section 1 — Scope and Correctness

- [ ] The change does only what was requested. No unrelated refactors, cleanups, or additions.
- [ ] No new abstractions were introduced for single-use operations.
- [ ] No backwards-compatibility shims, unused renamed variables, or "removed" comments were added.
- [ ] The change is the smallest correct implementation that achieves the stated goal.
- [ ] No behavior was invented that is not defined by the governing documents. If a decision was made that the docs do not address, the decision is explicitly documented.

**If any item fails:** Major (scope creep) or Critical (invented behavior contradicting docs).

---

## Section 2 — Documentation Adherence

For every governing document applicable to this change, verify the implementation matches it.

### Always check

- [ ] `docs/architecture/system-overview.md §6` — no system invariant is violated.
- [ ] `docs/domain/feature-voting.md` — no domain rule is reimplemented in the frontend, circumvented, or contradicted.

### For backend changes

- [ ] `docs/engineering/backend/data-modeling.md` — field types, lengths, nullability, `on_delete` directives, indexes all match.
- [ ] `docs/domain/voting-rules.md` — vote constraints, ranking rules, concurrency requirements all match.
- [ ] `docs/engineering/backend/api-conventions.md` — response envelope, status codes, field naming, pagination behavior all match.
- [ ] `docs/engineering/backend/security.md` — authentication, permission class requirements, protected fields, rate limiting all match.

### For frontend changes

- [ ] `docs/architecture/frontend-architecture.md` — directory structure, component ownership, data flow all match.
- [ ] `docs/engineering/frontend/react-standards.md` — naming, component structure, TypeScript standards all match.
- [ ] `docs/engineering/frontend/api-consumption.md` — service layer rules, Axios instance usage, response handling, optimistic update procedure all match.
- [ ] `docs/engineering/frontend/state-management.md` — state tier placement, ownership rules, anti-patterns all respected.
- [ ] `docs/engineering/backend/api-conventions.md` — frontend consumes only fields that exist in the contract.

**If implementation diverges from a document:** Critical (if it violates a constraint) or Major (if it deviates from a guideline).

---

## Section 3 — Architecture and Layer Boundaries

### Backend

- [ ] Business logic is in services. Not in views. Not in serializers.
- [ ] Complex read logic is in selectors. Not in views.
- [ ] Models define fields and constraints only. No request-aware behavior, no workflow orchestration.
- [ ] Views are thin: authenticate, apply permissions, validate via serializer, delegate to service or selector, return response.
- [ ] Permission classes are named and explicit. No implicit or inherited-by-default authorization.
- [ ] Serializers own input validation and output shaping. No multi-step side effects inside `create()` or `update()`.

**Violation severity:** Critical if business logic is in views or authorization is missing. Major if a layer boundary is breached without a security consequence.

### Frontend

- [ ] HTTP calls are only in `services/`. No `axios` or `fetch` in components, hooks, or utilities.
- [ ] Components in `components/` are domain-agnostic and receive all data via props.
- [ ] Feature-specific hooks are in `features/<domain>/hooks/`. Not in the top-level `hooks/`.
- [ ] Pages only assemble features and components. No inline data fetching or domain-specific conditional logic.
- [ ] Service functions call only the centralized Axios instance from `services/api.ts`.

**Violation severity:** Critical if `axios`/`fetch` is outside `services/`. Major for structural boundary violations.

---

## Section 4 — Security and Permissions

- [ ] Every protected endpoint has an explicit permission class (`IsAuthenticated`, `IsAdminUser`, `IsAuthorOrAdmin`, or equivalent).
- [ ] Object-level ownership checks are present for: edit feature request, delete feature request, change status, remove vote.
- [ ] `author_id` is derived from the authenticated session — never from a client-supplied field.
- [ ] `vote_count` is not a writable serializer field. Not accepted from any client in any request body.
- [ ] `status_id` is not writable by non-admin users in any flow.
- [ ] `is_admin` cannot be set by any client.
- [ ] Admin-only operations (status management, reference data mutation) are explicitly guarded.
- [ ] No stack trace, raw DB error message, or internal model name appears in any error response.
- [ ] No secret, credential, token, or environment value is committed in any file.
- [ ] Rate limiting is applied to high-value mutation endpoints if they are new or modified.

**Violation severity:** All security findings are Critical.

---

## Section 5 — Domain Integrity

- [ ] `vote_count` is computed via `Count('votes')` at query time. Not stored on `FeatureRequest`. Not computed in serializers without queryset preparation.
- [ ] `has_voted` is annotated per authenticated user at query time. Never derived from click history in the frontend.
- [ ] Ranking order is exactly `vote_count DESC, created_at DESC, id DESC`. No deviation. No substitution. No additional sort keys.
- [ ] `rate` does not appear in any `order_by()` expression in the backend. Does not appear in any sort, filter, rank, or ordering expression in the frontend.
- [ ] Vote uniqueness is enforced at two layers: service-layer existence check before insert, AND a database unique constraint on `(user_id, feature_request_id)`.
- [ ] Duplicate vote (application-layer catch): returns `200 OK`. Not `409`. Not `400`.
- [ ] Duplicate vote (concurrent `IntegrityError`): caught and returned as `200 OK`. Not `500`.
- [ ] Unvote with no existing vote: returns `200 OK`. Not `404`.
- [ ] Voting is permitted on feature requests in any status, including terminal statuses.
- [ ] All votes carry equal weight. No user attribute or `rate` value affects vote weight.

**Violation severity:** All domain integrity violations are Critical.

---

## Section 6 — API Contract and State Correctness

### API contract

- [ ] All success responses use: `{ "data": <payload>, "meta": <pagination | null> }`.
- [ ] All error responses use: `{ "error": { "code": str, "message": str, "details": obj | null } }`.
- [ ] Vote/unvote response: `{ "data": { "feature_request_id": int, "has_voted": bool, "vote_count": int }, "meta": null }`.
- [ ] Feature response includes nested: `status { id, name, color, is_terminal }`, `category { id, name, icon, color }`, `author { id, name }`.
- [ ] No undocumented fields in any response.
- [ ] No sensitive user fields (`email`, `password`, tokens) in any feature request response.
- [ ] `sort=rate` and `sort=-rate` return `400 Bad Request`.
- [ ] All list endpoints are paginated. No unbounded querysets.

### Frontend state

- [ ] Server state lives in TanStack Query cache only. No copies in `useState`, `useRef`, or Context.
- [ ] `AuthContext` is the only Context that holds API data.
- [ ] Query keys are defined as named constants. No inline strings inside hook calls.
- [ ] After mutations (except vote/unvote): relevant query key is invalidated and refetched. Cache is not manually updated with assumed values.
- [ ] Vote/unvote optimistic update: snapshot → estimate → send → overwrite with `VoteResponse` on success → rollback on failure. This is the only mutation permitted to use optimistic updates.
- [ ] Feature list is rendered in API response order. `Array.sort()` is never applied to the feature list.
- [ ] `author_id` and `status_id` do not appear in non-admin form submission payloads.

**Violation severity:** Critical for contract violations and state duplication. Major for missing query key invalidation.

---

## Section 7 — Testing Adequacy

The following behaviors must have test coverage. An untested invariant is a finding.

### Backend — required tests

| Behavior | Severity if absent |
|---|---|
| Duplicate vote does not create a second record | Critical |
| Repeated vote call returns `200 OK` with unchanged state | Critical |
| Unvote with no existing vote returns `200 OK` | Critical |
| Concurrent duplicate vote → `IntegrityError` caught → `200 OK` | Critical |
| `vote_count DESC` ranking is correct | Critical |
| `rate` does not affect feature list ordering | Critical |
| Admin-only status change: non-admin returns `403` | Critical |
| `author_id` cannot be client-supplied | Critical |
| `vote_count` is not writable by clients | Critical |
| Unauthenticated access to protected endpoints returns `401` | Major |
| Input validation: invalid `rate`, missing required fields, invalid FK references | Major |
| `sort=rate` returns `400 Bad Request` | Major |

### Frontend — required tests (where applicable)

| Behavior | Severity if absent |
|---|---|
| Loading state is rendered while data is fetching | Major |
| Error state is rendered on API failure | Major |
| Empty state is rendered when list has zero results | Major |
| Vote button is disabled during in-flight mutation | Major |
| Optimistic update rolls back on mutation failure | Major |
| `author_id` and `status_id` absent from non-admin payloads | Critical |

### General

- [ ] Negative paths are tested: unauthorized access, invalid input, duplicate operations, missing resources.
- [ ] Tests do not mock the database for constraint-sensitive behavior (unique constraints, `IntegrityError` handling).
- [ ] Tests are close to the behavior they validate. No testing of implementation details.

---

## Section 8 — Anti-Pattern Detection

### Backend anti-patterns

- [ ] **Business logic in views** — any non-trivial workflow must be in a service. *Critical.*
- [ ] **Workflow orchestration in serializer `create()`/`update()`** — complex logic belongs in services. *Critical.*
- [ ] **Missing DB constraint on `Vote(user_id, feature_request_id)`** — application-layer check alone is insufficient. *Critical.*
- [ ] **`rate` in any `order_by()`** — `rate` has no effect on ranking. *Critical.*
- [ ] **`IntegrityError` not caught for concurrent vote duplicates** — must return `200 OK`. *Critical.*
- [ ] **`author_id` as a writable serializer field** — always derived from session. *Critical.*
- [ ] **`vote_count` as a writable serializer field** — computed, never stored or accepted. *Critical.*
- [ ] **Missing permission class on a write endpoint** — all protected endpoints must declare permissions. *Critical.*
- [ ] **Missing object-level authorization** — for edit, delete, status change. *Critical.*
- [ ] **Unbounded queryset on a list endpoint** — no pagination applied. *Major.*
- [ ] **N+1 queries** — per-row related object access without `select_related`/`prefetch_related`. *Major.*
- [ ] **Raw DB errors or stack traces in error responses** — *Critical.*
- [ ] **Happy-path-only tests** — no permission or negative path coverage. *Major.*
- [ ] **Repeated queryset logic across views instead of a shared selector** — *Major.*

### Frontend anti-patterns

- [ ] **`axios` or `fetch` called outside `services/`** — *Critical.*
- [ ] **Server state copied into `useState`** — *Critical.*
- [ ] **`vote_count` incremented/decremented locally** — outside the defined optimistic update. *Critical.*
- [ ] **`has_voted` derived from click history** — must come from API response. *Critical.*
- [ ] **Feature list sorted with `Array.sort()`** — *Critical.*
- [ ] **`rate` used in any ordering or filter expression** — *Critical.*
- [ ] **`any` in TypeScript** — without explicit justification. *Major.*
- [ ] **`snake_case` API fields renamed to `camelCase` in types** — *Major.*
- [ ] **Flat component file in `components/` without its own directory** — *Major.*
- [ ] **Component directory not named `kebab-case`** — *Minor.*
- [ ] **Entry point not named `index.tsx`** — *Major.*
- [ ] **`useState(false)` for loading state TanStack Query already tracks** — *Major.*
- [ ] **Missing loading, error, or empty state in an async-dependent component** — *Major.*
- [ ] **`author_id` or `status_id` in non-admin form submission payloads** — *Critical.*
- [ ] **Backend rules reimplemented in frontend** — vote uniqueness, ranking, status permissions. *Critical.*
- [ ] **Inline query key strings inside hook calls** — *Major.*

---

## Output Format

Every review produces a structured report:

```
REVIEW REPORT
=============
Change summary: [one paragraph — what changed, which documents govern it]

Findings:
[For each finding:]
  Severity: Critical / Major / Minor
  Location: [file path and line number]
  Rule violated: [document name and section]
  Description: [what is wrong and why it matters]
  Fix required: [what must change]

Missing tests:
[For each missing test:]
  Behavior: [what must be validated]
  Test layer: [model / serializer / service / selector / API / component / hook]
  Severity: Critical / Major

Verdict: Approved / Changes Required / Blocked
Reason: [required if not Approved]
```

**Verdict definitions:**
- `Approved` — no Critical or Major findings.
- `Changes Required` — one or more Major findings. Must be resolved before merge.
- `Blocked` — one or more Critical findings. Must not merge until resolved.

A review that produces no findings on a non-trivial change is suspicious. Re-examine.
