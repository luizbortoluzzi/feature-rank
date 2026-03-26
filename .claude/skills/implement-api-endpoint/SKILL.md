---
name: implement-api-endpoint
description: Implement a backend API endpoint in full conformance with the documented API contract, layer boundaries, security requirements, and test coverage rules.
---

# Skill: implement-api-endpoint

## Purpose

Implement a backend API endpoint correctly: correct layer boundaries, documented response shape, explicit permission classes, idempotency handling, and full test coverage. No implementation begins until the contract is written and the design is confirmed.

---

## When to Use

- When creating a new backend endpoint
- When modifying an existing endpoint's behavior, response shape, or permissions
- When adding a new action to an existing ViewSet

For non-trivial endpoints, run `design-backend-feature` first and use its output as input here.

---

## Required Inputs

- Endpoint purpose: what it does, which domain entity it operates on
- Proposed request and response behavior — or confirm this will be derived in Step 2

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/engineering/backend/api-conventions.md` — response envelope, HTTP status codes, error format, field naming, pagination, prohibited shapes. Every endpoint must conform exactly. Read completely.
2. `docs/architecture/backend-architecture.md` — layer responsibilities. Views own HTTP concerns only. Services own mutations. Selectors own reads.
3. `docs/engineering/backend/security.md` — authentication, object-level permissions, protected fields, rate limiting.
4. `docs/engineering/global/testing-strategy.md` — mandatory test coverage: happy path, negative paths, permission checks, idempotency.

**Read if applicable:**
- `docs/domain/voting-rules.md` — required if the endpoint involves votes, `vote_count`, `has_voted`, ranking, or `rate`.
- `docs/engineering/backend/data-modeling.md` — required for field definitions and constraints on entities this endpoint reads or writes.

Do not write implementation code before completing these reads.

---

## Phase 1: Design (Steps 1–6)

Complete all design steps before writing any implementation code. A gate separates Phase 1 from Phase 2.

### Step 1 — Identify endpoint purpose and owning domain

State:

```
Action: <list / create / retrieve / update / delete / vote / unvote / transition / custom>
Domain entity: <FeatureRequest / Vote / User / Status / Category>
Django app: <app name>
New or modified: <new / modifying existing — name existing URL/action>
```

### Step 2 — Write the full request/response contract

Write this before any code. Every field must be named.

```
Endpoint contract:
  Method: <GET / POST / PUT / PATCH / DELETE>
  URL: <pattern>
  Authentication: required / not required
  Permission class: <exact class name>

  Request body:
    <field>: <type>, required / optional
    Forbidden from client: [author_id / vote_count / status_id if non-admin — keep applicable]

  Query parameters (list endpoints):
    page: integer
    page_size: integer
    <filter fields>: <type>
    <sort fields>: <allowed values — rate is never an allowed sort value>

  Success response:
    HTTP: <status code>
    Body: { "data": <exact shape>, "meta": <pagination shape or null> }

  Failure responses:
    <scenario>: HTTP <code>, { "error": { "code": "<value>", "message": "<string>", "details": <shape or null> } }

  Idempotency:
    <describe — or "not applicable">
```

Idempotency rules that are mandatory:
- `POST /api/features/{id}/vote/`: returns `200 OK` whether the vote is new or already exists
- `DELETE /api/features/{id}/vote/`: returns `200 OK` whether the vote existed or not
- Neither returns `409 Conflict`. Neither returns `404` for missing vote.

If this contract change affects the frontend: **stop. Defer to `architect`.** Write: "DEFER TO ARCHITECT: contract change affects frontend." Do not implement either layer.

### Step 3 — Define the serializer(s)

State the field list for each serializer before writing code:

```
Serializer: <Name>  [read / write / both]
  Fields: <list>
  Read-only: <list — author, vote_count, created_at, updated_at>
  Write-only: <list — passwords, tokens>
  Excluded: <author_id, vote_count, status_id (non-admin) — never writable>
  Nested objects: <field: shape>
```

Use separate serializers for read and write when the shapes differ meaningfully. Serializers contain input validation and output shaping only — no workflow logic.

### Step 4 — Determine whether a service is required

A service is **required** for any mutation that:
- Creates or updates more than one record
- Enforces a business rule beyond field validation
- Requires `transaction.atomic()`
- Involves vote creation or vote removal (always)
- Involves status transitions

A service is **not required** for: simple single-record reads, reference data reads, trivially simple creates with no side effects.

State: `Service required: yes / no — <reason>`

### Step 5 — Define permission class

State for every endpoint:

```
Authentication class: <SessionAuthentication / JWTAuthentication / etc.>
Permission class: <exact class name — IsAuthenticated / IsAdminUser / IsAuthorOrAdmin / custom>
Object-level permission (has_object_permission): required / not required — <reason>
Admin-only gate: yes / no — derived from user.is_admin, never from request body
```

A named permission class is required for every sensitive endpoint. Inline `if request.user.is_admin` checks in views are not a substitute for a permission class when object-level protection is required.

### Step 6 — Name every required test

Write the full test name for every case before writing code:

```
Tests required:
- test_<actor>_<action>_<expected_outcome>  [layer]
```

Minimum required:
- Happy path: authenticated user with valid input → correct response and status code
- Validation failure: missing required field → `400` with field-level `details`
- Authentication failure: unauthenticated → `401`
- Permission failure: authenticated but unauthorized → `403`
- Not found: invalid ID → `404`
- Protected field: `author_id` or `vote_count` in body → stripped or ignored
- Idempotency (if vote/unvote): duplicate → `200` with correct state; missing → `200` with correct state
- Admin-only (if applicable): non-admin → `403`

---

## Gate — Confirm Phase 1 is complete

Before writing any implementation code, confirm:
- [ ] Contract written (Step 2)
- [ ] Serializer fields defined (Step 3)
- [ ] Service determination made (Step 4)
- [ ] Permission class named (Step 5)
- [ ] All test names written (Step 6)
- [ ] No blocking issues from Steps 2–5

If any box is unchecked, complete it before proceeding.

---

## Phase 2: Implementation (Steps 7–11)

Implement in this order. Do not reorder.

### Step 7 — Implement serializer(s)

Write serializers from the spec in Step 3:
- Apply `read_only=True` for all read-only fields
- Never accept `author_id`, `vote_count`, or `status_id` (non-admin) as writable — exclude them entirely
- Never expose `password`, auth tokens, raw DB error messages, or internal model names
- Shape output to match the contract in Step 2 exactly
- No workflow logic in serializers

### Step 8 — Implement service (if required)

Write service functions:
- Own the mutation workflow end-to-end
- Wrap multi-write operations in `transaction.atomic()`
- For vote creation: check for existing vote before insert (application-layer guard), then catch `IntegrityError` from concurrent duplicate inserts and return current state — never raise, never return `409`
- For vote removal: if vote does not exist, return current state — never raise `404`
- Do not import from views or depend on HTTP request objects where avoidable
- No serializer logic, no response formatting in services

### Step 9 — Implement selector (if read endpoint or annotated query)

Write selector functions for every list or annotated read:
- Selectors are read-only — they must not mutate state
- `vote_count`: always annotated using `Count('votes')` — never stored, never computed in Python
- `has_voted`: always annotated using `Exists` or `Count` filtered to `request.user.id`
- Feature list ordering: always `vote_count DESC, created_at DESC, id DESC` — applied in the selector, not in the view, not in the serializer
- `rate` must never appear in any `order_by()` call
- Always apply `select_related` and `prefetch_related` for all known related objects on the queryset

### Step 10 — Implement view or ViewSet action

Write the view:
- Apply authentication and permission classes declared in Step 5
- Call serializer for input validation
- Call service (mutations) or selector (reads) — do not construct querysets in views
- Return response conforming exactly to the contract in Step 2
- Use the HTTP status codes from Step 2 — do not deviate

Views must not contain: ORM queries, queryset construction, ranking logic, business workflow logic.

### Step 11 — Implement permission class

Write the named permission class from Step 5:
- `has_permission()` for endpoint-level checks
- `has_object_permission()` for object-level checks (edit, delete, ownership-sensitive)
- Admin checks verify `request.user.is_admin` — this value is never derived from a request body field

---

## Phase 3: Tests (Step 12)

### Step 12 — Write all tests named in Step 6

Write every test named in Step 6. Do not skip any.

Requirements:
- Use the real database — do not mock it for constraint-sensitive tests
- Check response body shape, not just status codes
- For idempotency tests: verify the database state (record count), not just the HTTP response

---

## Expected Output

- Serializer(s) implementation
- Service function (if required)
- Selector function (if required)
- View or ViewSet action
- Permission class(es)
- Tests for all cases named in Step 6
- API contract summary matching Step 2

---

## Failure Conditions

Stop immediately and write `BLOCKED:` if:

- The required behavior contradicts `docs/engineering/backend/api-conventions.md` or `docs/domain/voting-rules.md`
- The contract change affects the frontend — write `DEFER TO ARCHITECT:` and stop
- A permission check cannot be expressed as a named permission class
- The response shape requires accepting `author_id`, `vote_count`, or `status_id` (non-admin) from the client
- A constraint-sensitive test cannot be written against the real database

---

## Anti-Patterns — Forbidden

- Writing implementation code before Phase 1 is complete
- Business logic or queryset construction in views
- Workflow logic in serializer `create()` or `update()`
- Returning `409 Conflict` for duplicate votes
- Returning `204 No Content` for unvote — contract requires `200 OK` with body
- Accepting `author_id`, `vote_count`, or `status_id` (non-admin) from the client
- Inline permission checks in views instead of named permission classes
- `rate` in any `order_by()` expression
- Mocking the database for constraint-sensitive tests

---

## References

- `docs/engineering/backend/api-conventions.md`
- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/rules/backend-rules.md`
- `.claude/agents/backend-engineer.md`
- `.claude/skills/design-backend-feature/SKILL.md`
