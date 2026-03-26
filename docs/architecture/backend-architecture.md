# Backend Architecture

Defines the backend architecture for this repository.

This document describes how the Django backend should be organized, how responsibilities are split, and how backend components should collaborate.

It is a repository standard, not a generic tutorial.

---

## Goals

The backend architecture must be:

- clear
- maintainable
- explicit
- secure
- testable
- evolvable
- consistent with domain rules
- suitable for web and mobile API clients

The architecture should optimize for:

- correctness first
- explicit boundaries
- low accidental complexity
- strong domain integrity
- predictable API behavior

---

## Architectural Style

The backend follows a layered, domain-oriented architecture built on Django and Django REST Framework.

It is not strict clean architecture with excessive indirection, and it is not “fat views + random helpers”.

The intended style is:

- Django apps as domain boundaries
- DRF views for transport layer concerns
- serializers for validation and representation
- services/use-cases for business workflows
- selectors/query functions for non-trivial reads
- models for data structure, relationships, and invariants
- database constraints for critical integrity guarantees

This is a pragmatic architecture:
- structured enough to scale
- simple enough to move quickly
- explicit enough for safe agent-driven development

---

## High-Level Layers

The backend should be understood in these layers:

### 1. Transport Layer

Owns HTTP concerns.

Includes:
- DRF views / viewsets
- request parsing
- authentication
- permission entry points
- serializer invocation
- status code selection
- response formatting

Does not own complex domain workflows.

---

### 2. Application Layer

Owns use-cases and workflow orchestration.

Includes:
- services
- status transition orchestration
- vote creation/removal workflows
- feature creation/edit flows
- moderation actions
- transaction boundaries

This layer coordinates domain behavior across models and components.

---

### 3. Domain/Data Layer

Owns domain structure and persistence rules.

Includes:
- models
- relationships
- managers/querysets where appropriate
- database constraints
- domain invariants that are intrinsic to the data model

This layer should not depend on HTTP details.

---

### 4. Query Layer

Owns read patterns that are complex enough to deserve reuse.

Includes:
- selectors
- annotated query builders
- reusable filtered list queries
- efficient prefetch/select_related composition

This layer is read-oriented and should not mutate state.

---

## Domain Apps

Recommended app layout inside `backend/apps/`:

- `users`
- `roles`
- `categories`
- `statuses`
- `feature_requests`

Optional future apps:
- `comments`
- `notifications`
- `audit`
- `attachments`

### App Ownership

#### `users`
Owns:
- custom user model
- user identity fields
- user account lifecycle flags
- user-facing profile-safe representations if needed

#### `roles`
Owns:
- role reference data
- role semantics used by product logic

#### `categories`
Owns:
- controlled category reference data

#### `statuses`
Owns:
- controlled lifecycle states for feature requests

#### `feature_requests`
Owns:
- feature request model
- vote model
- feature request workflows
- vote workflows
- ranking queries
- status change workflows for feature requests unless extracted later

---

## Recommended Module Layout Per App

Within each app, prefer this structure when the app grows beyond trivial size:

- `models.py` or `models/`
- `serializers.py` or `serializers/`
- `views.py` or `views/`
- `services.py` or `services/`
- `selectors.py`
- `permissions.py`
- `validators.py`
- `urls.py`
- `tests/`

Not every app must start with all files, but responsibilities must remain explicit.

---

## Core Component Responsibilities

### Models

Models define:
- fields
- relationships
- database-backed invariants
- small domain-relevant helpers
- metadata
- managers/querysets when justified

Models must not become workflow engines.

Good model responsibilities:
- constraints
- basic derived properties
- concise domain methods
- explicit relationship definitions

Avoid in models:
- long orchestration logic
- request-aware behavior
- authorization logic
- API formatting
- multi-step side effects

---

### Serializers

Serializers define:
- input validation
- API payload shaping
- field exposure rules
- normalization of incoming data where appropriate

Use separate serializers for read and write when that improves clarity.

Preferred split:
- list serializer
- detail serializer
- create/update serializer
- admin-oriented serializer if necessary

Do not bury complex business workflows in serializer `create()` or `update()` methods unless the logic is truly trivial.

---

### Views / ViewSets

Views coordinate HTTP-level behavior.

Views should:
- authenticate
- apply permissions
- validate input using serializers
- call services or selectors
- return consistent responses

Views should not:
- implement ranking logic directly
- own state transitions
- coordinate multi-step business workflows
- embed repeated ORM complexity

Custom actions are acceptable when they clearly belong to a resource, for example:

- `POST /feature-requests/{id}/vote/`
- `DELETE /feature-requests/{id}/vote/`
- `POST /feature-requests/{id}/change-status/` (if action-based rather than PATCH-based)

---

### Services

Services own non-trivial mutation workflows.

Use services for:
- create feature request
- update feature request with ownership/permission rules
- cast vote
- remove vote
- change feature status
- archive feature request
- admin moderation actions

A service should:
- have a single clear purpose
- accept explicit arguments
- enforce workflow rules
- use transactions when needed
- return predictable outcomes
- remain independent from HTTP request objects where possible

Services are the default place for business logic once logic stops being trivial.

---

### Selectors

Selectors own reusable read logic.

Use selectors for:
- feature request listing with filters
- vote count annotation
- public detail retrieval
- admin detail retrieval
- current-user list variants with `has_voted`
- dashboard-oriented summary queries

Selectors help avoid:
- fat views
- repeated queryset logic
- accidental query inefficiency

Selectors must be read-only.

---

### Permissions

Permissions define access control at API boundaries.

Use explicit permission classes and object-level checks.

Examples:
- `IsAuthenticated`
- `IsAdminUser`
- `IsAuthorOrAdmin`
- `CanManageStatuses`
- `CanManageReferenceData`

Permission logic should be easy to locate and test.

---

## Main Backend Flows

### 1. Feature Request Creation

Flow:

1. authenticated request hits endpoint
2. input serializer validates writable fields
3. author is derived from authenticated user
4. service creates feature request
5. response serializer returns created representation

Rules:
- author is not client-controlled in normal flow
- category and status references must be validated
- rate must be bounded 1..5

---

### 2. Feature Request Listing

Flow:

1. request hits list endpoint
2. query params validated/sanitized
3. selector builds filtered annotated queryset
4. pagination applied
5. list serializer returns stable representation

Requirements:
- explicit ordering
- efficient related loading
- deterministic ranking
- support for future filtering/search growth

---

### 3. Vote Creation

Flow:

1. authenticated request hits vote endpoint
2. feature request existence is checked
3. service attempts vote creation
4. database uniqueness protects integrity
5. conflict/idempotent behavior is handled safely
6. updated representation or minimal success response is returned

Requirements:
- concurrency safety
- no duplicate votes
- predictable response under repeated calls

---

### 4. Vote Removal

Flow:

1. authenticated request hits unvote endpoint
2. service removes caller-owned vote only
3. missing vote is handled safely
4. response remains predictable and idempotent

---

### 5. Status Change

Flow:

1. request hits status update endpoint/action
2. permission is checked
3. serializer validates target status payload
4. service validates allowed transition
5. service applies change transactionally
6. audit/log hooks may run if implemented
7. response returns updated state

Status changes should not be raw unrestricted PATCH behavior unless intentionally designed that way.

---

## Data Ownership Rules

The backend owns:

- identity truth for authenticated user context
- vote integrity
- ranking logic
- reference data validity
- lifecycle state transitions
- protected field control
- field exposure policy

The frontend must not be treated as an authority for:
- author assignment
- vote legitimacy
- admin capability
- lifecycle transitions
- hidden field mutation

---

## Reference Data Strategy

`Role`, `Category`, and `Status` are controlled reference entities.

Rules:

- they should not be treated as free-form strings
- they should usually be managed by admin flows or deterministic seed data
- their names should be unique
- deletion should be restrictive if referenced
- UI metadata such as color and icon is allowed, but must not drive core business rules

### Seeding

If these entities are required at startup, use one deterministic mechanism:

- data migration
- idempotent management command
- explicit fixture strategy

Do not rely on manual initial creation unless that is intentional and documented.

---

## Write Path vs Read Path

This backend should conceptually separate write logic from complex read logic.

### Write Path
Uses:
- serializers for validation
- services for workflows
- models and database constraints for persistence integrity

### Read Path
Uses:
- selectors
- serializers for representation
- annotations/prefetch/select_related for efficient retrieval

This avoids mixing:
- mutation orchestration
- complex query shaping
- transport logic

---

## Transaction Boundaries

Transactions are required when multiple persistence steps must succeed or fail together.

Typical cases:
- vote create/remove when cached counters or audit records exist
- status transition + audit event
- moderation actions touching multiple rows
- future notification or activity event emission if done synchronously

Do not leave mutation workflows in partially updated state.

---

## Constraint Strategy

Critical guarantees must exist at more than one layer when appropriate.

### Example: Vote Uniqueness

Enforce through:
- API behavior
- service behavior
- database unique constraint on `(user_id, feature_request_id)`

### Example: Rate Field

Enforce through:
- serializer validation
- database check constraint if supported

### Example: Protected Ownership Fields

Enforce through:
- serializer writable field policy
- service logic
- permission logic

The database is the final integrity boundary, not the only one.

---

## Query Design Strategy

List endpoints and ranking views are likely to become the hottest paths.

Recommended approach:
- annotate `vote_count`
- `select_related` for `author`, `category`, `status`
- use explicit ordering
- paginate always
- add indexes for actual filter/sort patterns

For authenticated list views, `has_voted` may be included if useful, but must be implemented deliberately and efficiently.

Do not compute per-row expensive queries inside serializer methods unless the queryset was prepared for it.

---

## Status Transition Architecture

Lifecycle transitions should be centralized.

Recommended approach:
- transition policy defined in a service or policy module
- permission checked explicitly
- transition legality validated explicitly
- side effects handled in one place

Possible future enhancement:
- dedicated transition map
- audit event generation
- transition reasons
- admin notes

Do not scatter transition logic across many views or serializers.

---

## Error Handling Strategy

The backend should distinguish:

- validation errors
- permission errors
- not found errors
- conflict/integrity errors
- unexpected internal errors

### Rules

- convert low-level failures into stable API responses
- do not leak raw exceptions
- keep error shapes consistent
- log internal details safely

Typical examples:
- duplicate vote -> conflict or idempotent success, depending on contract
- invalid rate -> validation error
- unauthorized status change -> forbidden
- missing feature request -> not found

---

## API Representation Strategy

Representations should be intentionally designed.

### Public / Standard Feature Request Representation
Should typically include:
- id
- title
- description
- rate
- vote_count
- has_voted (if authenticated context available)
- author summary
- category summary
- status summary
- created_at
- updated_at

### Nested Objects
Use minimal nested representations rather than exposing unrelated internals.

Avoid sending:
- sensitive user fields
- admin-only metadata
- ORM-driven accidental payloads

---

## Security Alignment

The backend architecture assumes and depends on the following:

- explicit auth strategy
- backend-enforced permissions
- object-level ownership checks
- DB-backed invariants
- safe error handling
- restrictive reference-data mutation
- concurrency-safe vote flows

Security is not an add-on layer after implementation. It is part of the architecture.

---

## Observability and Admin Operations

The architecture should leave room for:

- structured logging
- admin moderation actions
- future audit trails
- metrics on voting and feature submission
- error monitoring

Even if not all of these are implemented on day one, the architecture should not prevent them.

---

## Evolution Path

The initial system does not need microservices, event buses, or extreme abstraction.

Preferred growth path:

### Phase 1
- monolithic Django app structure with domain-separated apps
- service layer for non-trivial workflows
- selectors for read complexity
- direct REST API

### Phase 2
- stronger audit logging
- cached counters if justified
- richer moderation flows
- comments/notifications if added

### Phase 3
- more advanced analytics/search
- asynchronous processing where real need exists
- finer-grained operational tooling

Do not prematurely optimize into complexity.

---

## Things to Avoid

- fat views
- serializer-centric workflow orchestration
- hidden permission logic
- free-form status/category strings in feature requests
- repeated queryset logic across endpoints
- missing database constraints for core invariants
- direct client control of protected fields
- ad hoc ranking logic in multiple places
- premature introduction of patterns the team cannot maintain

---

## Backend Change Checklist

Before merging a backend change, verify:

1. Is the responsibility in the correct layer?
2. Does this workflow belong in a service?
3. Does read complexity belong in a selector?
4. Are permissions explicit?
5. Are protected fields client-safe?
6. Is a database constraint needed?
7. Is ordering deterministic?
8. Are queries efficient enough?
9. Does the change preserve API consistency?
10. Should docs or ADRs be updated?

---

## Summary

This backend should feel boringly reliable.

That means:

- domain-oriented Django apps
- thin transport layer
- service-based write workflows
- selector-based complex reads
- database-backed integrity
- explicit permissions
- deterministic ranking
- stable API contracts
- straightforward evolution as the product grows
