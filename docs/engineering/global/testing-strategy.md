# Testing Strategy

Defines the testing strategy for the backend of this repository.

This document describes what must be tested, how tests should be distributed, and what quality standards are expected before code is considered trustworthy.

It is not a generic testing manifesto. It is the testing policy for THIS backend.

---

## Goals

Backend tests must give confidence that the system is:

- correct
- secure
- stable
- maintainable
- resistant to regressions
- safe under normal and edge-case usage

Testing should protect business behavior, not merely increase coverage numbers.

---

## Testing Principles

1. Test business risk first.
2. Prefer meaningful tests over inflated coverage.
3. Test invariants at the right layer.
4. Keep tests deterministic.
5. Use the smallest test scope that gives real confidence.
6. Write tests that fail for the right reasons.
7. Protect contracts, permissions, and critical workflows.
8. Avoid testing framework internals.
9. Prefer clarity over overly clever test abstractions.
10. Treat concurrency-sensitive and permission-sensitive paths as first-class test targets.

---

## Main Test Layers

The backend should use multiple layers of tests.

### 1. Model / Constraint Tests

Use when validating:
- field constraints
- uniqueness constraints
- relationship behavior
- basic model invariants
- custom manager/queryset behavior if present

Examples:
- unique email
- unique category name
- unique status name
- unique vote `(user_id, feature_request_id)`
- bounded `rate` if enforced at model/database level

These tests are useful for data integrity, but they do not replace service or API tests.

---

### 2. Serializer Tests

Use when validating:
- required fields
- type handling
- input normalization
- field-level validation
- object-level validation that belongs in serializer context
- writable vs read-only field policy

Examples:
- missing title rejected
- invalid rate rejected
- unknown writable protected fields rejected
- invalid category/status references rejected if handled here

Serializer tests are especially useful when input validation is important and errors should remain stable.

---

### 3. Service Tests

Service tests are required for non-trivial business workflows.

Use them for:
- vote creation/removal logic
- status transitions
- ownership-sensitive edits
- moderation actions
- conflict handling
- transactional workflows
- orchestration across models

This is one of the most important test layers in this architecture.

Examples:
- casting a vote creates one vote only
- duplicate vote attempt does not create a second record
- unauthorized status change is rejected
- author can edit own feature request if policy allows
- status transition rules are enforced

---

### 4. Selector / Query Tests

Use when read logic becomes non-trivial.

Test:
- ranking queries
- filtering behavior
- annotated vote counts
- authenticated query variants such as `has_voted`
- pagination-related queryset correctness if selector owns part of it

Examples:
- top features are ordered by vote count descending
- tie ordering is deterministic
- category filter limits results correctly
- status filter behaves correctly

These tests are valuable because list endpoints are often complex and easy to break indirectly.

---

### 5. API Tests

API tests verify:
- endpoint contract
- status codes
- authentication requirements
- permission behavior
- response shape
- integration of serializer + service + persistence

Examples:
- unauthenticated user cannot create feature request
- authenticated user can vote
- duplicate vote returns expected API behavior
- admin can change status
- normal user cannot manage categories
- list endpoint returns paginated results in expected shape

API tests should cover critical flows, not every trivial permutation.

---

## What Must Be Tested

At a minimum, the backend must test the following areas.

### Authentication

- protected endpoints reject unauthenticated access
- inactive/suspended user behavior matches policy
- current-user endpoint behaves correctly

### Authorization

- normal users cannot perform admin-only actions
- object ownership rules are enforced
- status/category/role management is restricted as designed
- author/admin edit behavior follows policy

### Feature Request Validation

- title required
- description required
- rate required
- rate must be between 1 and 5
- invalid category/status references are rejected
- protected author assignment cannot be spoofed by clients

### Voting Integrity

- user can vote once on a feature request
- duplicate vote does not create duplicates
- unvote only removes caller's own vote
- removing a missing vote behaves according to contract
- vote count remains correct

### Ranking Behavior

- features are ordered correctly
- tie-breaking is deterministic
- rate does not accidentally replace popularity unless documented
- list responses show correct counts

### Status Transition Rules

- only allowed actors may change status
- invalid transitions are rejected if transitions are controlled
- status changes persist correctly
- future terminal-state rules are covered if introduced

### Reference Data

- role/category/status uniqueness
- restricted deletion/update behavior if enforced
- seeded data assumptions remain valid if applicable

### Error Handling

- validation errors return expected structure
- not-found responses are correct
- conflict responses are correct where used
- sensitive internals are not leaked in errors

---

## Recommended Test Distribution

A healthy test mix for this backend should typically look like:

- focused serializer tests for validation-heavy inputs
- service tests for business rules
- API tests for contract and permission behavior
- selector tests for ranking/filtering complexity
- a smaller number of model/constraint tests for hard invariants

Do not rely only on API tests.
Do not rely only on unit tests.
Use the layer that best protects the risk.

---

## Priority Matrix

When deciding what to test first, prioritize in this order:

### Highest Priority
- permissions
- vote uniqueness
- ranking correctness
- status transitions
- protected field integrity
- feature creation/edit rules

### Medium Priority
- reference data management
- filter behavior
- pagination metadata
- serializer edge cases

### Lower Priority
- trivial admin plumbing
- simple getters/setters
- framework behavior with no custom logic

---

## Concurrency and Race Condition Testing

Voting is concurrency-sensitive and deserves explicit attention.

### Required Concern

The system must remain correct if multiple requests try to create the same vote at nearly the same time.

### Minimum Expectation

The test suite should at least verify the behavior expected when duplicate vote attempts happen.

If feasible, include a test that simulates or approximates concurrent duplicate vote attempts and confirms:
- only one vote exists
- API/service behavior remains stable
- vote count remains correct

### Note

Not every project needs a heavy concurrency harness on day one, but vote uniqueness must be protected beyond happy-path testing.

---

## Transactional Workflow Testing

Whenever a service performs multiple writes that must succeed or fail together, tests should verify atomicity-sensitive behavior.

Examples:
- status change plus audit event if added later
- vote mutation plus cached counter update if later introduced
- moderation flows spanning multiple rows

If no side effects exist yet, keep tests simpler. As side effects grow, tests must grow too.

---

## Negative Testing

Negative paths are mandatory.

Examples:
- invalid rate
- invalid category
- invalid status
- unauthorized edit
- unauthorized vote removal
- invalid status change
- attempts to set protected fields directly
- duplicate vote request
- missing feature request

A backend is not well-tested if only happy paths are covered.

---

## Response Contract Testing

API tests should verify not just status codes, but also response structure when that structure is important to consumers.

Important areas:
- success payload shape
- error payload shape
- pagination metadata
- nested author/category/status representations
- presence of vote-related computed fields when applicable

Do not overfit tests to incidental field order or unrelated formatting.

---

## Fixtures and Factories

Prefer factories/builders over large static fixtures.

Recommended approach:
- factory for user
- factory for role
- factory for category
- factory for status
- factory for feature request
- factory for vote

Benefits:
- tests stay readable
- data setup stays flexible
- unnecessary coupling to giant fixtures is avoided

### Rules

- factory defaults should produce valid objects
- test-specific invalid states should be explicit
- shared setup should remain understandable

Avoid huge fixture files that hide intent.

---

## Test Naming

Use names that describe behavior clearly.

Examples:
- `test_user_cannot_vote_twice_for_same_feature`
- `test_admin_can_change_feature_status`
- `test_feature_list_is_ordered_by_vote_count_desc`
- `test_author_cannot_set_status_directly_on_create`

Good names reveal:
- actor
- action
- expected outcome

---

## Test Organization

Organize tests close to their responsibility.

Recommended structure by app:

- `tests/models/`
- `tests/serializers/`
- `tests/services/`
- `tests/selectors/`
- `tests/api/`

Not every app needs every folder on day one, but the separation should stay understandable as the codebase grows.

---

## What Not To Test Excessively

Avoid over-investing in tests for:

- Django/DRF built-in behavior with no customization
- trivial model `__str__` methods unless meaningful
- pure passthrough code with no business risk
- implementation details that may change without affecting behavior
- brittle snapshots of large JSON payloads when focused assertions are enough

The goal is confidence, not noise.

---

## Edge Cases To Cover

The following edge cases are especially relevant for this product:

- duplicate vote attempts
- voting on non-existent feature request
- deleting or archiving feature requests with votes
- editing feature request without ownership
- invalid rate boundary values (0, 6, null, string)
- tie ranking behavior
- status change to invalid/non-existent status
- category/status deletion while in use if restricted
- user deactivation and its impact on protected operations
- empty result lists with pagination

---

## Security-Oriented Testing

Because security is central to backend quality, tests must explicitly cover:

- authentication requirements
- role-based restrictions
- admin-only reference data mutations
- object-level authorization
- hidden field protection
- error shape safety for invalid/forbidden actions

At minimum, every sensitive write endpoint should have:
- authenticated success test where relevant
- unauthenticated failure test
- unauthorized failure test

---

## Performance-Sensitive Query Testing

For list/selectors that power the main UI, consider lightweight query-shape testing when useful.

Potential targets:
- feature request list does not produce obvious N+1
- annotated vote count query remains correct
- related author/category/status retrieval is efficient enough

Do not turn every test into a query-count test, but use them strategically for hotspots.

---

## Regression Testing Policy

When fixing a bug:

1. write or update a test that would have caught it
2. confirm the test fails before the fix if practical
3. implement the fix
4. keep the regression test

This is especially important for:
- permissions bugs
- ranking bugs
- duplicate vote bugs
- serializer validation bugs
- state transition bugs

---

## Minimum Test Suite Expectations Before Merge

A backend change is not considered adequately tested unless:

- core happy path is covered
- likely negative path is covered
- permission behavior is covered if relevant
- serializer/service/API layer coverage matches the risk of the change
- no critical integrity rule is left untested

For high-risk changes, include both service and API tests.

---

## CI Expectations

The test suite should be suitable for CI execution.

Requirements:
- deterministic
- isolated
- reasonably fast
- no hidden dependency on local machine state
- no reliance on unordered test execution

If tests are flaky, fix or remove the flakiness before trusting them.

---

## Decision Checklist

Before merging a backend change, ask:

1. What business rule could regress here?
2. Which layer best protects that rule?
3. Do permissions need explicit tests?
4. Could invalid input bypass the intended validation?
5. Could repeated or concurrent actions corrupt data?
6. Does the API contract need verification?
7. Do list/ranking queries need selector tests?
8. Should this become a regression test?

---

## Minimum Non-Negotiables

The backend test strategy is not being followed unless all of these are true:

- vote uniqueness is tested
- permission-sensitive endpoints are tested
- feature request validation is tested
- ranking behavior is tested
- status transition behavior is tested if transitions exist
- critical negative paths are tested
- tests protect business behavior, not just framework plumbing

---

## Summary

A good backend test suite for this project should make it hard to accidentally break:

- vote integrity
- ranking
- permissions
- lifecycle control
- API contracts
- validation behavior

The test suite should be practical, readable, and strongly aligned with real product risk.
