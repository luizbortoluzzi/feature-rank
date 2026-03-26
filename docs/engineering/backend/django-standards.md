# Django Standards

Defines how Django and Django REST Framework must be used in this repository.

This document is not a generic Django tutorial. It describes the implementation standards for THIS backend.

---

## Objectives

The backend must be:

- maintainable
- explicit
- testable
- secure
- scalable enough for realistic growth
- aligned with domain rules and API contracts

Django code should optimize for clarity and correctness before cleverness.

---

## Core Principles

1. Keep views thin.
2. Keep business rules out of templates and UI assumptions.
3. Put domain workflows in services/use-cases when logic is non-trivial.
4. Use serializers for input validation and output transformation.
5. Use models for data structure and invariants, not for sprawling workflows.
6. Use database constraints for critical integrity rules.
7. Prefer explicit query behavior.
8. Keep API contracts stable and predictable.
9. Keep apps cohesive and responsibilities clear.
10. Prefer boring, readable Django over magic.

---

## Recommended Project Organization

Inside `backend/`, organize the project so responsibilities are easy to locate.

A recommended layout is:

- `apps/`
  - `users/`
  - `roles/`
  - `feature_requests/`
  - `categories/`
  - `statuses/`
- `config/` or project package for Django settings and root URLs
- shared/common modules only when they genuinely reduce duplication

Within each Django app, prefer structure such as:

- `models.py` or `models/`
- `serializers.py` or `serializers/`
- `views.py` or `views/`
- `services.py` or `services/`
- `selectors.py` (optional, for read/query logic)
- `permissions.py`
- `validators.py`
- `urls.py`
- `tests/`

The exact module split may evolve, but responsibilities must remain clear.

---

## App Boundaries

Each app should own a coherent part of the domain.

Recommended ownership:

- `users` owns user model behavior and user-facing identity concerns
- `roles` owns role reference data and role semantics
- `categories` owns category reference data
- `statuses` owns lifecycle reference data
- `feature_requests` owns feature request workflows and votes unless votes later deserve their own app

Avoid spreading one domain concept across many apps without reason.

### App Boundary Rules

- one app must not casually reach into another app's private implementation details
- cross-app imports should go through stable model/service boundaries
- do not create a `utils.py` dumping ground for domain logic
- shared code should be extracted only when reuse is real

---

## Models

Models should define:

- fields
- relationships
- constraints
- narrow, model-relevant behavior
- useful metadata such as ordering only when truly universal

### Good Model Responsibilities

Acceptable model responsibilities include:

- field definitions
- relationship definitions
- `__str__`
- simple invariant helpers
- lightweight derived properties
- model metadata
- database constraints
- custom managers/querysets when query behavior is central

### Avoid in Models

Avoid putting these directly in models if they become non-trivial:

- multi-step workflows
- permission logic
- API response shaping
- orchestration across multiple entities
- request-aware behavior
- large side-effect chains

### Constraints

Critical business invariants belong in database constraints whenever possible.

Examples:

- unique user email
- unique vote `(user_id, feature_request_id)`
- bounded `rate` field if supported

### Timestamps

Use explicit timestamps consistently.

Recommended baseline:

- `created_at`
- `updated_at`

Use timezone-aware datetimes.

---

## Custom User Model

Prefer a custom user model from the start.

Recommended reasons:

- email-first identity
- future extensibility
- avoiding painful migration from Django's default user later

Recommended fields include:

- name
- email
- role
- is_admin
- is_active
- created_at
- updated_at

Do not delay custom user adoption if the project already knows it needs custom fields.

---

## Reference Data Models

Entities such as `Role`, `Category`, and `Status` are controlled reference data.

### Expectations

- names should be unique
- presentation metadata such as color/icon should be validated
- deletion policy should be restrictive while referenced
- these entities should not be hardcoded in many places

If the application uses seeded statuses/categories/roles, seed logic must be deterministic and idempotent.

---

## Services Layer

A services layer is required for non-trivial business workflows.

Services may also be called use-cases or application services, but the responsibility is the same: orchestrate domain operations cleanly.

### Use Services For

- create feature request workflow
- vote / unvote workflow
- status transition workflow
- admin moderation workflow
- operations spanning multiple models
- operations requiring transactions
- operations with authorization-sensitive branching
- workflows that create logs/events/audit records

### Do Not Use Services As

- random wrappers around single ORM calls
- giant god-modules with unrelated business logic
- a place to hide messy code without boundaries

### Service Design Guidelines

A service should:

- have a clear purpose
- accept explicit inputs
- enforce important rules or delegate to validators/policies
- return a clear result
- use transactions when required
- avoid coupling to HTTP request objects unless absolutely necessary

Example service names:

- `create_feature_request(...)`
- `cast_vote(...)`
- `remove_vote(...)`
- `change_feature_status(...)`

Keep service naming action-oriented.

---

## Selectors / Query Layer

For non-trivial read logic, a dedicated query layer is recommended.

Selectors are especially useful for:

- list queries with annotations
- ranking queries
- filtered search endpoints
- reusable read models for admin vs public views

### Use Selectors For

- annotated feature request lists with vote counts
- filtered and paginated querysets
- efficient prefetch/select_related query composition

### Benefits

- avoids fat views
- avoids repeating ORM logic
- keeps read concerns separate from write workflows

If selectors are used, they should remain read-only.

---

## Serializers

Serializers are the primary boundary for API input validation and response transformation in DRF.

### Input Serializer Responsibilities

- validate incoming data
- enforce writable field policy
- normalize data when appropriate
- provide clear validation errors

### Output Serializer Responsibilities

- shape API response
- expose only allowed fields
- avoid hidden database leakage

### Recommended Practice

For non-trivial endpoints, consider separate serializers for:

- input/write
- output/read

This helps avoid confusion around writable vs computed fields.

### Serializer Rules

- do not hide business logic in serializer `create()` / `update()` when that logic is significant
- use serializers for validation, not large orchestration
- explicitly control writable fields
- reject or ignore unexpected fields consistently according to policy

### Avoid

- massive serializers handling validation, authorization, orchestration, and representation all at once
- serializer methods that execute surprising side effects
- serializers coupled to frontend-specific hacks

---

## Views and ViewSets

Views should coordinate request handling, not own business complexity.

### Good View Responsibilities

- authenticate request
- authorize request
- call serializer for input validation
- call service / selector / ORM appropriately
- return response with correct status code

### Keep Views Thin

A view should not become the place where the entire product logic lives.

### When Using ViewSets

ViewSets are acceptable if they keep routing and basic CRUD concise. Do not force every workflow into a generic ViewSet action if the result becomes less clear.

Custom actions are fine when:

- the action is truly resource-related
- the semantics are clear
- permissions are explicit

For example:

- `POST /feature-requests/{id}/vote/`
- `DELETE /feature-requests/{id}/vote/`

### Avoid

- fat views with multiple nested branches
- direct business orchestration mixed with response formatting
- repeating the same permission logic across many views without extraction

---

## Permissions and Authorization

Permissions must be explicit and backend-enforced.

### Use DRF Permissions Intentionally

Use:

- authentication checks
- role-based checks
- object-level ownership checks

### Examples

- any authenticated user may create a feature request
- only the author or admin may edit a feature request, if editing is allowed
- only admin may manage categories/statuses/roles
- only the authenticated user may remove their own vote

### Standards

- permission logic should be easy to locate
- object-level checks should not be forgotten in update/delete paths
- do not bury authorization in random serializer or model code unless it is truly domain-invariant and documented

---

## Validation Strategy

Validation should happen across the appropriate layers.

### Serializer Validation

Use for:

- required fields
- type validation
- reference existence checks when appropriate
- bounded values
- friendly API errors

### Model Validation

Use when validation is intrinsic to the model and not request-context dependent.

### Database Constraints

Use for invariants that must never be violated.

### Service-Level Validation

Use for:

- authorization-sensitive decisions
- transition policy
- workflow-level rules
- conflict handling
- multi-entity consistency

Do not assume one layer alone is sufficient for all validation.

---

## Queryset and ORM Standards

ORM usage must be explicit and performance-aware.

### Rules

- avoid N+1 queries
- use `select_related` for foreign-key relationships
- use `prefetch_related` for reverse and many-related access
- annotate aggregates when list endpoints need computed values
- keep query semantics easy to reason about

### Feature Request Listing Expectations

Public or dashboard list queries will likely need:

- author
- category
- status
- vote count
- maybe `has_voted` for current user

This should be implemented with deliberate query composition, not ad hoc ORM usage scattered through views.

### Avoid

- implicit lazy loading in loops
- repeated count queries per row
- loading entire related collections when only a count is needed
- query logic duplicated in many endpoints

---

## Ranking and Aggregation Standards

Ranking is central to this product and must be implemented deliberately.

### Requirements

- deterministic ordering
- efficient enough for list views
- safe under growth
- backend-defined semantics

### Recommended Initial Pattern

Use queryset annotation for `vote_count` and explicit ordering, for example by:

1. vote count descending
2. created_at descending or chosen tie-breaker
3. id descending as final stabilizer if needed

### Rate Field

`rate` is not the same as `vote_count`.

If `rate` influences ordering, the rule must be explicitly documented. Do not mix popularity and intrinsic priority accidentally.

---

## Transactions and Atomic Operations

Use `transaction.atomic()` when operations must remain consistent as a unit.

Typical cases:

- cast vote with side effects
- unvote with side effects
- status transition + audit log
- moderation workflows
- any future cached counter synchronization

### Important Rule

Do not write multi-step mutation workflows that can leave partial state if an error occurs midway.

---

## Handling Integrity Errors and Conflicts

When the database protects invariants, the application must handle resulting integrity errors gracefully.

Common case:

- duplicate vote insertion under concurrency

### Standard

- catch integrity errors where expected
- convert them into predictable domain/API responses
- do not leak raw database exceptions to clients

---

## Status Transition Design

Status transitions must not be free-form updates unless the product explicitly wants that.

Recommended approach:

- centralize status transition logic in a service
- validate allowed transitions
- enforce authorization there as well
- optionally create audit events

Do not allow arbitrary client patching of status IDs with no policy.

---

## Soft Deletion vs Hard Deletion

Deletion strategy must be explicit.

### Recommended Guidance

For user-generated product records, consider soft deletion or archival where product history matters.

### If Using Hard Delete

- ensure cascade/restrict behavior is explicit
- ensure business impact is acceptable

### If Using Soft Delete

- define queryset behavior clearly
- decide whether deleted records remain visible to admins
- ensure unique constraints still behave as intended

Do not mix soft and hard delete semantics casually.

---

## API Response Standards

API responses must follow the documented contract.

### Rules

- use consistent response shape
- use consistent error structure
- do not expose fields by accident
- keep list and detail payloads intentional
- preserve backward compatibility where possible

### Suggested Practice

- separate read serializers from write serializers
- keep public nested representations minimal but useful
- include computed fields intentionally, not incidentally

---

## Pagination, Filtering, and Search

List endpoints should be production-aware even in early versions.

### Standards

- paginate list endpoints
- keep filtering explicit
- validate query params where relevant
- document supported filters
- avoid unbounded result sets

Feature requests should eventually support filtering by:

- category
- status
- author
- search term

---

## Seed Data and Reference Initialization

If the system depends on initial statuses, roles, or categories, define a stable initialization path.

Options include:

- Django data migrations
- management commands
- fixture loading with care

### Requirements

- idempotent
- deterministic
- environment-safe
- documented

Do not rely on manual admin creation for critical reference data unless that is an intentional product choice.

---

## Testing Standards

Testing must focus on domain behavior, API behavior, and invariants.

### Required Areas

- model constraints where meaningful
- serializer validation
- service behavior
- permission enforcement
- API endpoint responses
- vote uniqueness behavior
- ranking correctness
- status transition rules

### Recommended Test Distribution

- unit tests for pure helpers/policies
- service tests for workflows
- API tests for contract + permission behavior
- integration tests for critical multi-step flows

### Avoid

- tests tightly coupled to incidental implementation details
- massive end-to-end-only strategy with no focused tests
- redundant tests for framework behavior with no business value

---

## Naming Conventions

Use names that reveal intent.

### Models

- singular nouns: `FeatureRequest`, `Vote`, `Category`

### Services

- verb-oriented names: `cast_vote`, `change_status`

### Serializers

- explicit names such as:
  - `FeatureRequestCreateSerializer`
  - `FeatureRequestDetailSerializer`
  - `VoteCreateSerializer`

### Permissions

- intent-revealing names such as:
  - `IsAdminUserOrReadOnly`
  - `IsAuthorOrAdmin`

### Avoid

- vague names like `Helper`, `Manager` when the responsibility is unclear
- overloaded `utils.py` files
- service names that do not reflect domain action

---

## Code Style Expectations

- follow repository formatter/linter rules
- keep functions reasonably small
- prefer explicit branching over clever compression
- keep imports organized
- avoid excessive indirection
- avoid premature abstraction
- keep comments for non-obvious intent, not obvious code narration

---

## Performance Standards

The codebase does not need premature optimization, but it must avoid obvious performance mistakes.

### Minimum Expectations

- no N+1 in list/detail hotspots
- no repeated aggregate queries in loops
- paginated list endpoints
- efficient related loading
- deliberate indexing for real query patterns

### When Performance Work Is Needed

- profile or measure first when possible
- document why a more complex solution is introduced
- keep correctness ahead of caching tricks

---

## Migrations Standards

Migrations must be intentional and reviewable.

### Rules

- keep migrations small when possible
- do not edit historical migrations already applied in shared environments
- ensure new constraints reflect actual domain rules
- review data migration safety carefully
- keep destructive changes deliberate and documented

---

## Admin Usage

Django admin may be used for internal support or reference-data management, but it must not become the hidden business interface unless that is a deliberate product decision.

### Use Admin For

- controlled reference data
- internal moderation support
- low-volume operational tasks

### Do Not Assume

- admin replaces real API/business rules
- admin actions bypass integrity expectations
- admin-only workflows never need tests

---

## Configuration Standards

Settings must be environment-aware and explicit.

### Recommended Practice

- split settings by environment if needed
- keep secrets out of code
- document required environment variables
- make production defaults safe

Common environment-sensitive settings include:

- debug
- allowed hosts
- database
- CORS/CSRF
- email
- storage
- authentication config
- logging

---

## Observability

The backend should be debuggable without leaking internals.

### Expectations

- structured logging if feasible
- meaningful error capture
- clear audit trail for admin workflows over time
- request IDs/correlation IDs if the system grows

---

## Decision Checklist for Backend Changes

Before merging a backend change, verify:

1. Is the responsibility in the right layer?
2. Should this logic live in a service?
3. Is authorization explicit?
4. Is serializer validation sufficient?
5. Is a database constraint needed?
6. Could concurrency break this?
7. Are queries efficient enough?
8. Does the API contract remain consistent?
9. Are tests covering the real business risk?
10. Do docs need an update?

---

## Minimum Non-Negotiables

This backend is not aligned with repository standards unless:

- views are kept thin
- non-trivial workflows use services
- API input is serializer-validated
- critical invariants use database constraints
- vote logic is concurrency-safe
- permissions are backend-enforced
- queries avoid obvious N+1 behavior
- list endpoints are paginated
- tests cover core business rules

---

## Summary

Use Django in a way that makes the system boringly reliable.

That means:

- clear app boundaries
- thin views
- explicit serializers
- service-based workflows
- database-backed integrity
- permission-aware mutations
- efficient query patterns
- stable API contracts
- tests around real risks
