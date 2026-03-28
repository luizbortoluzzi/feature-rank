# ADR-004: Backend Layered Architecture (Views / Services / Selectors)

## Status

Accepted

## Context

Django and Django REST Framework offer significant flexibility in where business logic is placed. In a naive implementation, views grow to contain business logic, ORM calls, permission checks, and response formatting all at once. This produces fat views that are hard to test in isolation, difficult to reason about, and resistant to change.

For Feature Rank, the backend owns all domain logic: vote uniqueness, status transitions, ranking computation, author identity enforcement, and protected field guarding. This logic needed to live somewhere predictable and testable, separate from HTTP concerns.

The question was where to draw the lines and how strictly to enforce them.

## Decision

The backend follows a four-layer architecture with explicit, non-overlapping responsibilities:

**Views (`apps/*/views.py`)**
Handle HTTP concerns only: receive the request, authenticate the caller, invoke the relevant permission class, delegate input to a serializer for validation, call the appropriate service or selector, and return a response with the correct status code. Views contain no ORM calls, no business logic, and no conditional branching on domain state.

**Services (`apps/*/services.py`)**
Own all non-trivial mutation workflows. Any operation that involves more than a single model save belongs in a service: vote creation with idempotency and concurrency handling, status transitions with validity checks, feature request creation where author and default status must be derived rather than accepted from the client, and updates where protected fields must be stripped. Services receive typed arguments (not request objects) and raise DRF exceptions when domain rules are violated.

**Selectors (`apps/*/selectors.py`)**
Own all complex read logic. They return annotated, filtered, and ordered querysets. `vote_count` is computed here via `Count` aggregation; `has_voted` is computed here via an `Exists` subquery. Selectors apply `select_related` explicitly to avoid N+1 queries. Selectors are strictly read-only — they must never mutate state.

**Models (`apps/*/models.py`)**
Define fields, relationships, and database-level constraints. They contain no request-aware behavior, no authorization logic, and no multi-step side effects. The `Vote` model's `unique_together` constraint is enforced at this layer regardless of service behavior. No `vote_count` field exists on `FeatureRequest` — it is always annotated at query time.

**Serializers (`apps/*/serializers.py`)**
Handle input validation and output representation. Separate read and write serializers are used for feature requests: the read serializer exposes nested author, category, and status representations; the write serializer handles validation and explicitly excludes fields that must never be client-supplied (`author_id`, `vote_count`, and `status_id` for non-admin flows).

## Consequences

**Benefits:**
- Views remain thin and easy to audit for HTTP correctness. Adding a new endpoint means writing a small view that delegates immediately.
- Business rules live in services, where they can be unit-tested without HTTP machinery. Tests call service functions directly with typed arguments.
- Selectors centralize query logic. The same annotation pattern (`vote_count`, `has_voted`, `select_related`) is applied consistently across list and detail endpoints without duplication.
- The model layer's database constraints (e.g., `unique_together` on votes) act as a concurrency safety net that holds even if a service-layer check is bypassed by a concurrent request.
- New contributors have a clear answer to "where does this code go?"

**Trade-offs:**
- More files per app than a typical Django app with fat views. Each domain app has at minimum: `models.py`, `views.py`, `serializers.py`, `services.py`, `selectors.py`, `permissions.py`, `urls.py`.
- Strictly enforcing the layer boundary requires discipline — it is not mechanically enforced by Django itself.
- Simple operations (e.g., a trivial read with no filtering) still route through the selector layer for consistency, which adds indirection.

## Alternatives Considered

**Fat views (all logic in ViewSets):** Common in smaller Django projects, but results in code that is difficult to test without firing HTTP requests, hard to reuse across endpoints, and prone to logic duplication as the project grows.

**Logic in serializer `create()` / `update()` methods:** DRF serializers support this pattern, but it conflates validation with business logic and makes the execution flow hard to follow. Multi-step workflows that require transactions or conditional branching become unmanageable in serializers.

**Service layer only (no selector layer):** A single service layer handles both reads and writes. This is simpler but tends to produce service methods that mix query building with workflow logic. Separating reads into selectors keeps each layer single-purpose.

**Domain-driven design with explicit domain objects:** Full DDD (entities, value objects, repositories, domain events) is a valid approach for complex domains, but adds significant structural overhead for a system of this size. The current architecture captures the essential separation without the ceremony.

## Evidence

- `backend/apps/feature_requests/views.py` — thin ViewSet delegates to `get_feature_requests_list`, `create_feature_request`, `vote_feature_request`, etc.
- `backend/apps/feature_requests/services.py` — `create_feature_request` derives author from `user` argument; `vote_feature_request` uses `get_or_create` + `IntegrityError` catch; `update_feature_request` pops protected fields; `change_feature_request_status` validates transitions via `VALID_TRANSITIONS` dict
- `backend/apps/feature_requests/selectors.py` — `get_feature_requests_list` annotates `vote_count` and `has_voted`, applies `select_related`, enforces ordering; `rate` explicitly absent from `VALID_SORT_VALUES` and `SORT_MAP`
- `backend/apps/feature_requests/models.py` — `FeatureRequest` has no `vote_count` field; `Vote.Meta.unique_together`; model docstrings document the two-layer constraint enforcement design
- `backend/apps/feature_requests/serializers.py` — separate `FeatureRequestListSerializer` (read) and `FeatureRequestWriteSerializer` (write) with protected field exclusions
- `docs/architecture/backend-architecture.md` — authoritative specification of layer responsibilities
