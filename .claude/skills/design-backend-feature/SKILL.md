---
name: design-backend-feature
description: Produce a complete, architecture-aligned backend implementation plan before writing any code. Run this before implement-backend-feature, implement-api-endpoint, or implement-django-models for non-trivial changes.
---

# Skill: design-backend-feature

## Purpose

Produce a complete, architecture-aligned backend implementation plan before writing any code. This skill is a gate, not a suggestion. No backend code is written until this skill is complete.

---

## When to Use

- Before implementing any non-trivial backend feature, workflow change, or domain rule change
- Before changing API behavior, permissions, or data constraints
- Before any security-sensitive change

This skill is a prerequisite for `implement-backend-feature`, `implement-api-endpoint`, and `implement-django-models` when the scope is non-trivial. Run it first.

---

## Required Inputs

Before starting, confirm you have:
- A precise description of the feature or change (not a vague goal — a specific behavior change)
- Clarity on whether the API contract is changing

If the input is vague, ask for clarification before proceeding.

---

## Step 0 — Run map-repo

Execute the `map-repo` skill before any other step.

From the `map-repo` output, extract and record:
- Every file in `backend/` that is affected or likely affected
- Every domain invariant that applies to this change
- Whether any API endpoint is added, changed, or removed
- Whether the frontend consumes the affected endpoint(s)

Do not proceed to Step 1 until `map-repo` is complete.

---

## Required Documents

Read every document in the "Always read" list before Step 1. Read the "Read if applicable" documents before the step where they become relevant. Do not skip any document that applies.

**Always read:**
1. `docs/architecture/backend-architecture.md` — layer responsibilities. Where each type of logic belongs. Non-negotiable.
2. `docs/engineering/backend/data-modeling.md` — field types, length limits, nullability, `on_delete` behaviors, uniqueness constraints, access control per entity. Read the entity you are touching, not just the summary.
3. `docs/engineering/backend/api-conventions.md` — response envelope, HTTP status codes, error format, field naming, pagination, prohibited shapes.
4. `docs/engineering/backend/security.md` — authentication, object-level permissions, protected fields, rate limiting.
5. `docs/engineering/global/testing-strategy.md` — mandatory test coverage, test layer distribution, pre-merge requirements.

**Read if applicable:**
- `docs/domain/voting-rules.md` — required if the feature touches votes, `vote_count`, `has_voted`, ranking, or `rate`. Read the entire document, not just the summary.
- `docs/domain/feature-voting.md` — required if the feature touches `FeatureRequest`, `Status`, `Category`, or user roles.

Do not proceed past Step 0 without completing this reading.

---

## Step 1 — Identify affected domain entities

Name every domain entity this feature touches:

```
Entities affected:
- <EntityName>: <what changes — fields, constraints, relationships, or "read only">
- <EntityName>: ...
```

For every entity listed, verify its canonical definition in `docs/engineering/backend/data-modeling.md`. Do not assume field names, types, nullability, or constraints — confirm them from the document.

If the entity is not in the doc and this is not a new entity, stop. The doc is the authority. Surface the discrepancy.

---

## Step 2 — Identify affected workflows and invariants

List every backend workflow this feature touches. For each workflow, state every invariant that applies.

Use this format:

```
Workflow: <name, e.g., "vote creation">
  Invariants that apply:
  - <invariant, traced to document+section>
  - ...
```

Invariant sources to check:
- `docs/domain/voting-rules.md`: vote uniqueness, idempotency, ranking rules, `rate` exclusion, concurrency behavior
- `docs/engineering/backend/security.md`: protected fields (`author_id`, `vote_count`, `status_id` for non-admin), ownership checks, admin-only gates
- `docs/engineering/backend/data-modeling.md`: uniqueness constraints, required fields, `on_delete` behaviors

State invariants explicitly — do not summarize them. A summary like "vote uniqueness applies" is insufficient. Write: "A `Vote` record is unique on `(user_id, feature_request_id)`. Enforced at DB level via `UniqueConstraint`. Application-layer check before insert. Concurrent duplicate insert → catch `IntegrityError` → return `200 OK` with current state."

---

## Step 3 — Identify API contract impact

Determine whether the feature adds, changes, or removes any endpoint, field, or response shape.

**If no API change:** state this explicitly and continue.

**If the API changes:** write the full proposed contract for every affected endpoint:

```
Endpoint: <METHOD> <URL>
Authentication: required / not required
Permission: <class name>
Request body:
  <field>: <type>, required/optional
  Forbidden from client: author_id, vote_count, status_id (non-admin) [keep or remove as applicable]
Response (success):
  HTTP status: <code>
  Body: { "data": <shape>, "meta": <pagination | null> }
Response (failure):
  <scenario>: HTTP <code>, error.code "<value>", error.details: <shape>
Idempotency: <describe if applicable>
```

**If the API change affects the frontend:** stop. Defer to `architect` before proceeding. Do not implement either layer until the contract is agreed. State explicitly: "This change requires frontend coordination. Deferring to architect."

---

## Step 4 — Identify auth and authorization implications

For every endpoint affected, state:

```
Endpoint: <METHOD> <URL>
Authentication class: <name>
Permission class: <name>
Object-level permission required: yes/no — <reason>
Admin-only: yes/no — <reason>
Protected fields (never writable by client): <list>
```

If an endpoint has no explicit permission class, that is a defect. Name the class before proceeding.

---

## Step 5 — Identify data integrity and concurrency concerns

State explicitly:

```
Uniqueness constraints required at DB level:
- <constraint name, fields, model>

Multi-step mutations requiring transaction.atomic():
- <workflow name, which steps must be atomic>

Concurrent request scenarios:
- <scenario>: <correct handling behavior>
```

If a uniqueness constraint cannot be expressed as a database constraint, stop. Application-layer-only enforcement is insufficient for critical invariants. Surface this as a blocking issue.

---

## Step 6 — Assign every piece of logic to a layer

For every piece of logic the feature requires, assign it to exactly one layer:

| Logic | Layer | File |
|---|---|---|
| <description> | model / serializer / service / selector / view / permission | `backend/<app>/<file>.py` |

Use the layer definitions from `docs/architecture/backend-architecture.md`. If the correct layer is ambiguous, resolve it from the doc before proceeding — do not leave it unassigned.

Selector responsibilities to verify: `vote_count` annotation using `Count('votes')`, `has_voted` annotation filtered by authenticated user ID, feature list ordering (`vote_count DESC, created_at DESC, id DESC`), `select_related` and `prefetch_related` for all known related objects.

---

## Step 7 — Name every required test

Before any implementation begins, write the full name of every test that must exist for this feature:

```
Test cases:
- test_<actor>_<action>_<expected_outcome>  [layer: model/service/selector/API]
- ...
```

Every category below must have at least one test if the corresponding behavior exists:
- Happy path: intended behavior succeeds
- Negative path: invalid input returns `400` with field-level `details`
- Authentication: unauthenticated returns `401`
- Authorization: unauthorized returns `403`
- Invariant enforcement: each constraint from Step 2 has a test
- Idempotency: if vote/unvote are involved
- Protected field rejection: client-supplied `author_id`, `vote_count` are stripped or ignored

Do not proceed to Step 8 until every test in this list has a name and an assigned layer.

---

## Step 8 — Produce the implementation plan

Output the following block. Do not proceed to implementation until this block is complete.

```
BACKEND DESIGN PLAN
===================
Feature: <description>
Entities affected: <from Step 1>
Workflows affected: <from Step 2>
Invariants that apply: <from Step 2, traced to documents>
API contract changes: <from Step 3, or "none">
Frontend impact: <from Step 3 — "none" or "defer to architect">
Auth/permission requirements: <from Step 4>
DB constraints required: <from Step 5>
Transactions required: <from Step 5>
Concurrency handling: <from Step 5>

Files to create:
- <path>: <purpose>

Files to modify:
- <path>: <description of change>

Layer assignments:
- <logic>: <layer>, <file>

Tests required:
- <test name>: <layer>

Blocking issues: <list, or "none">
```

If there are blocking issues, stop. Resolve them before writing code.

---

## Expected Output

A complete `BACKEND DESIGN PLAN` block as defined in Step 8. This plan is the input to `implement-backend-feature`, `implement-api-endpoint`, or `implement-django-models`.

---

## Failure Conditions

Stop immediately if:
- The feature requires behavior that contradicts a documented invariant — do not design around it; write "BLOCKED:" and name the conflict
- The API contract change affects the frontend — write "DEFER TO ARCHITECT:" and stop
- A required document is absent or silent on the behavior — write "DOC GAP:" and stop; do not invent behavior
- A uniqueness constraint cannot be enforced at the database level — write "BLOCKING CONSTRAINT ISSUE:" and stop
- The correct layer for a piece of logic cannot be determined from `docs/architecture/backend-architecture.md` — stop and resolve

---

## Anti-Patterns — Forbidden

- Writing any code before the `BACKEND DESIGN PLAN` is complete
- Leaving any logic unassigned to a layer
- Designing API behavior not grounded in `docs/engineering/backend/api-conventions.md`
- Accepting `author_id`, `vote_count`, or `status_id` (non-admin) from the client
- Using `rate` in any ordering expression
- Planning `vote_count` as a stored field on `FeatureRequest`
- Planning to return `409 Conflict` for duplicate votes — idempotent `200 OK` is required
- Skipping tests for any invariant identified in Step 2

---

## References

- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/domain/voting-rules.md`
- `docs/domain/feature-voting.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/rules/backend-rules.md`
- `.claude/agents/backend-engineer.md`
- `.claude/skills/map-repo/SKILL.md`
