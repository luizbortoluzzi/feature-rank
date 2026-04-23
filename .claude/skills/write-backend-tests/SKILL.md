---
name: write-backend-tests
description: Write backend tests that protect real business risk — domain invariants, permissions, API contracts, and constraint-sensitive behavior. Not framework behavior, not trivial CRUD.
---

# Skill: write-backend-tests

## Purpose

Write focused backend tests that protect real business risk. Each test must be traceable to a documented rule, invariant, or constraint. Tests that only verify framework behavior or trivial field persistence are not the goal of this skill.

---

## When to Use

- After completing backend feature or endpoint implementation — before declaring it done
- When fixing a bug — write the regression test before writing the fix
- When adding permission-sensitive or constraint-sensitive logic
- When a documented business rule has no existing test coverage

---

## Required Inputs

- A precise description of the code or workflow being tested
- Confirmation of which test layers are applicable (model, serializer, service, selector, API)

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/engineering/global/testing-strategy.md` — what must be tested, test layer distribution, naming conventions, mandatory pre-merge coverage, what constitutes a meaningful vs hollow test.

**Read if the behavior being tested involves these areas:**
- `docs/domain/voting-rules.md` — if tests involve votes, `vote_count`, `has_voted`, ranking, idempotency, or `rate`. This document defines the correct behavior to assert against.
- `docs/engineering/backend/api-conventions.md` — if tests verify API response shapes, status codes, error formats, or pagination structure.
- `docs/engineering/backend/security.md` — if tests verify authentication, permission enforcement, or protected field rejection.
- `docs/engineering/backend/data-modeling.md` — if tests verify field constraints, uniqueness, or `on_delete` behavior.

---

## Execution Steps

Execute every step in order. Do not write test code before Step 3 is complete.

### Step 1 — Identify the business rule or risk being protected

Before naming a single test, state explicitly:

```
Business rule: <exact rule, traced to a document and section>
Risk if not tested: <what breaks in production if this test does not exist>
Invariant: <which domain constraint or security constraint this protects>
```

Do not write tests that protect nothing more than "the field was saved." If you cannot state the business rule, do not write the test.

### Step 2 — Assign each area to the correct test layer

Use this table to assign each area under test to its natural layer. Do not test all invariants exclusively through the API layer.

| What is being tested | Test layer |
|---|---|
| DB constraint, field type, `on_delete` behavior | Model test |
| Input validation, field exposure, serialization shape | Serializer test |
| Business workflow, transaction behavior, idempotency logic | Service test |
| Annotation correctness, ordering, `has_voted` computation | Selector test |
| HTTP status codes, response shape, authentication, permissions | API test |

State the layer for each test area before writing any code.

### Step 3 — Name every test case before writing

Write the full name of every test before writing any code:

```
Tests to write:
- test_<actor>_<action>_<expected_outcome>  [layer]
- ...
```

The test name must describe the behavior, not the implementation path. `test_vote_endpoint` is not a test name. `test_authenticated_user_cannot_vote_twice_for_same_feature` is.

Confirm: every test in this list is traceable to a rule from the documents read above. If a test cannot be traced to a documented rule, remove it.

### Step 4 — Identify which mandatory tests apply to this code

The following tests are mandatory **when the corresponding behavior exists in the code under test**. Check each against the current scope. Do not write tests for behavior that does not exist here. Do not skip tests for behavior that does.

**Vote uniqueness and idempotency — mandatory when vote/unvote exists:**
- `test_user_cannot_create_duplicate_vote` — second `POST /vote/` returns `200 OK`, `Vote` count remains 1
- `test_concurrent_duplicate_vote_does_not_produce_duplicate_record` — use real DB; create duplicate via direct ORM call to verify `IntegrityError` is caught and state is correct
- `test_unvote_when_no_vote_exists_returns_200` — `DELETE /vote/` with no existing vote returns `200 OK`, no error raised

**Ranking — mandatory when the feature list endpoint exists:**
- `test_feature_list_ordered_by_vote_count_descending`
- `test_feature_list_tie_broken_by_created_at_descending`
- `test_rate_field_does_not_affect_feature_list_ordering`

**Protected fields — mandatory when feature create/update endpoints exist:**
- `test_author_is_set_from_session_not_request_body` — supply `author_id` in body; verify it is ignored
- `test_vote_count_is_not_writable_by_client` — supply `vote_count` in body; verify it is stripped
- `test_status_id_is_not_writable_by_non_admin` — non-admin supplies `status_id`; verify it is stripped or rejected

**Permissions — mandatory for every protected endpoint:**
- `test_unauthenticated_request_to_<endpoint>_returns_401`
- `test_non_owner_cannot_edit_feature_request`
- `test_non_owner_cannot_delete_feature_request`
- `test_non_admin_cannot_change_feature_status`
- `test_admin_can_change_feature_status`

**API contract — mandatory for every endpoint:**
- `test_success_response_body_follows_envelope_format` — `data` and `meta` keys present
- `test_error_response_body_follows_error_format` — `error.code`, `error.message`, `error.details` present
- `test_list_response_includes_pagination_metadata`

### Step 5 — Write happy path tests

For each feature or endpoint:
- Authenticated user with valid input → correct HTTP status code
- Response body matches the documented envelope shape
- Response data fields match expected values — check values, not just presence

### Step 6 — Write negative path tests

For each input validation rule:
- Missing required field → `400` with `error.details` containing the field name
- Invalid value (out of range, wrong type, too long) → `400` with field-level details
- Invalid FK reference (nonexistent related object) → `400` or `404` per documented behavior

Do not skip negative paths. Every validation rule needs at least one negative test.

### Step 7 — Write permission and authorization tests

For every protected endpoint:
- Unauthenticated request → `401`
- Authenticated but not owner → `403`
- Authenticated, correct permissions → success response
- Admin-only operation by non-admin → `403`

### Step 8 — Write constraint and concurrency tests

For constraint-sensitive behavior:
- **Use the real database.** Do not mock `IntegrityError` or `DatabaseError`. The constraint must actually exist in the DB for these tests to have meaning.
- Vote uniqueness: create one vote via service or ORM; attempt a second for the same user+feature; verify only one `Vote` record exists and the response is `200 OK`.
- For concurrent scenarios: call the service twice with the same arguments in sequence (not threaded, unless threading is already part of the test infrastructure); verify the `IntegrityError` path is exercised.

### Step 9 — Review test names before finalizing

For every test in the list:
- The name describes the behavior, not the code path
- The name is understandable without reading the body
- The failure message will be meaningful when the test fails

---

## Expected Output

- Named test cases at the correct layers
- Coverage of: happy paths, negative paths, permission paths, constraint paths
- Every test traceable to a documented rule
- Explicit statement of any remaining gaps if a constraint test cannot be written

---

## Failure Conditions

Stop and surface if:

- A critical invariant test (vote uniqueness, ranking, protected fields) cannot be written without mocking the database — do not mock; flag the gap and investigate why the constraint is absent
- A test cannot be traced to a documented rule — do not write it
- Tests pass but the behavior they cover is enforced only at the application layer (no DB constraint) — flag this as a separate structural issue

---

## Anti-Patterns — Forbidden

- Mocking the database for constraint-sensitive tests (uniqueness, FK cascade)
- Tests that check only HTTP status codes without asserting response body shape or field values
- Test names that describe code paths (`test_vote_endpoint`) instead of behavior (`test_user_cannot_vote_twice`)
- Tests that duplicate framework behavior with no domain meaning
- Skipping negative path tests
- Skipping permission tests for any protected endpoint
- Asserting `409 Conflict` for duplicate votes — the correct assertion is `200 OK` with unchanged state
- Using `rate` as a ranking factor in any test setup or assertion

---

## References

- `docs/engineering/global/testing-strategy.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/backend/data-modeling.md`
- `.claude/rules/backend-rules.md`
- `.claude/agents/backend-engineer.md`
