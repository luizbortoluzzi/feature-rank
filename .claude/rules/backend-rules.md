# Backend Implementation Rules

## Scope

These rules apply to all code under `backend/` and all backend-facing behavior. They govern Django + DRF implementation, domain integrity, API discipline, security, and testing.

They align with and must remain consistent with:
- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/general/testing-strategy.md`

When code conflicts with any of the above documents, the conflict must be surfaced explicitly. Agents must not silently invent behavior not defined by those docs.

---

## 1. Architecture Compliance

The backend follows a layered architecture. Responsibilities must stay in their defined layer.

**Layer ownership:**

| Layer | Owns |
|---|---|
| Views / ViewSets | HTTP concerns: auth entry point, serializer invocation, permission checks, status codes, response formatting |
| Services | Non-trivial mutation workflows: create, update, vote, unvote, status transitions, moderation |
| Selectors | Complex read logic: filtered lists, annotated queries, `has_voted` variants, reusable prefetch patterns |
| Serializers | Input validation, payload shaping, field exposure, normalization |
| Models | Fields, relationships, database constraints, small domain-relevant helpers |
| Permissions | Explicit access control at API boundaries |

**Mandatory:**
- Views must remain thin. They authenticate, apply permissions, validate via serializers, delegate to services or selectors, and return responses.
- Services own non-trivial mutation logic. Any workflow beyond a single model save belongs in a service.
- Selectors are read-only. They must not mutate state.
- Serializers own input validation and representation. Separate serializers for read and write when that improves clarity (list, detail, create/update).
- Models define structure and invariants. They must not contain request-aware behavior, authorization logic, API formatting, or multi-step side effects.
- Permission classes must be explicit and locatable. Use named classes: `IsAuthenticated`, `IsAdminUser`, `IsAuthorOrAdmin`, etc.

**Forbidden:**
- Business logic in views.
- Non-trivial workflow orchestration in serializer `create()` or `update()` methods.
- Ranking logic, state transition logic, or vote workflows directly in views.
- Authorization logic embedded implicitly inside models or serializers.
- Fat views that contain repeated ORM logic.
- Selectors that mutate state.

---

## 2. Domain Integrity

The backend is the sole source of truth for all domain state.

**Mandatory:**
- All critical invariants must be enforced in the backend, independent of frontend behavior.
- The database is the final integrity boundary. Application-layer checks alone are insufficient for concurrent or multi-client scenarios.
- Vote uniqueness must be enforced at two layers: the service layer (existence check before insert) and the database layer (unique composite constraint on `(user_id, feature_request_id)`). Both are required.
- `vote_count` must be derived from the actual count of `Vote` records at query time. It must not be stored on `FeatureRequest` unless a denormalization decision is explicitly documented.
- `vote_count` must never be accepted from the client in any request body. If received, strip or reject it.
- `rate` is the author's self-assessed importance (1–5). It must never appear in any sort or ordering expression for the feature list. It has no effect on ranking.
- The default feature list ordering is strictly: `vote_count` desc → `created_at` desc → `id` desc. This is mandatory and non-negotiable.
- Voting is permitted on feature requests in any status, including terminal statuses.
- All votes carry equal weight. No user attribute affects the value of a vote.

**Forbidden:**
- Storing `vote_count` on `FeatureRequest` without a documented denormalization decision.
- Using `rate` in any ORDER BY expression.
- Accepting `vote_count` from the client.
- Implementing vote uniqueness at the service layer only, without the database constraint.
- Any check-then-insert vote pattern without a database unique constraint as a concurrency safety net.

---

## 3. Security and Authorization

Authorization must be enforced entirely in the backend.

**Mandatory:**
- Every protected endpoint must declare its authentication and permission requirements explicitly.
- Object-level ownership checks are required for: editing a feature request, deleting a feature request, status changes, removing a vote.
- Author assignment on feature request creation must come from the authenticated user context — never from a client-supplied field.
- Vote ownership on removal must be derived from the authenticated session — never from a client-supplied `user_id`.
- Admin-only operations (status management, reference data mutation, moderation) must be explicitly protected.
- Protected fields (`author_id`, `vote_count`, `is_admin`, status assignment in non-admin flows) must not be client-controllable.
- Concurrent vote requests must not produce duplicate `Vote` records. The database unique constraint must be present.
- A `DatabaseError` or `IntegrityError` from a concurrent duplicate vote insert must be caught and returned as `200 OK` (idempotent success), not as a `500`.
- Rate limiting must be applied to high-value mutation endpoints: login, token refresh, feature creation, voting.
- Secrets must never be committed to the repository.

**Forbidden:**
- Relying solely on frontend state or client-supplied data for authorization decisions.
- Endpoint-only authorization when object ownership matters.
- Leaving vote uniqueness protection to the service layer alone.
- Exposing stack traces, raw database errors, or internal model names in API responses.
- Unguarded admin operations.
- Implicit permission logic that is not testable or locatable.

---

## 4. API Discipline

The backend API must follow the conventions defined in `docs/engineering/backend/api-conventions.md`.

**Mandatory:**
- All responses must follow the documented envelope structure: `{ "data": ..., "meta": ... }` for success, `{ "error": { "code": ..., "message": ..., "details": ... } }` for errors.
- HTTP status codes must match the documented contract. Vote and unvote operations return `200 OK` in all idempotent scenarios.
- Field names in responses must be `snake_case` and match what the API contract defines.
- Nested objects must use minimal representations. Feature request responses must not include sensitive user fields (email, password hash, tokens).
- Pagination must be applied to all list endpoints.
- Ordering must always be explicit and deterministic.
- API changes must be explicit. Identify all consumers before changing a response shape.

**Forbidden:**
- Undocumented response fields added without updating the API contract.
- Inconsistent error shapes across endpoints.
- Leaking raw ORM structures, sensitive fields, or internal implementation details into responses.
- Returning `204 No Content` for unvote — the contract requires `200 OK` with a response body.
- Changing a response shape without identifying frontend consumers.

---

## 5. Query Discipline

**Mandatory:**
- Use `select_related` and `prefetch_related` explicitly for all known related objects in list and detail queries.
- Annotate `vote_count` using aggregation. Do not compute it in serializer methods unless the queryset was already prepared for it.
- Use selectors for non-trivial read patterns. Do not repeat queryset logic across views.
- Apply explicit ordering to every queryset that will be paginated or displayed.
- Add database indexes for filter and sort patterns that are used in production paths.

**Forbidden:**
- N+1 queries. Any per-row related object access without prefetch or annotation is a defect.
- Computing `vote_count` per-row inside serializers without queryset preparation.
- Repeated queryset logic across multiple views instead of a shared selector.
- Undefined or non-deterministic ordering on paginated lists.

---

## 6. Transaction and Concurrency Discipline

**Mandatory:**
- Multi-step mutation workflows that must succeed or fail together must use transactions.
- Vote creation must be concurrency-safe. The database unique constraint on `(user_id, feature_request_id)` must be present.
- A concurrent duplicate vote that triggers a database integrity error must be handled gracefully — return `200 OK` as an idempotent success.
- Status transitions that generate audit events or touch multiple records must be wrapped in a transaction.

**Forbidden:**
- Vote creation implemented as a check-then-insert without the database constraint as a concurrency safety net.
- Multi-step workflows left in partially applied state on failure.
- Treating concurrent request scenarios as edge cases that can be ignored.

---

## 7. Testing Expectations

**Mandatory:**
- Tests must cover: business rules, permission enforcement, ranking behavior, validation logic, and domain invariants.
- Negative paths must be tested: unauthorized access, duplicate vote attempts, invalid field values, protected field override attempts, missing resources.
- The following behaviors must always have tests:
  - Vote uniqueness (including concurrent scenario if feasible)
  - Idempotent vote and unvote behavior
  - Default feature list ordering (`vote_count` desc → `created_at` desc → `id` desc)
  - `rate` not affecting ranking
  - Admin-only operation protection
  - Author derived from session, not client input
  - Protected fields rejected or stripped on client submission
- High-risk changes require corresponding tests before merging.

**Forbidden:**
- Merging business rule changes without test coverage.
- Skipping negative path tests.
- Tests that mock the database for constraint-sensitive behavior where the real constraint must be verified.

---

## 8. Reference Data Discipline

`Role`, `Category`, and `Status` are controlled reference entities.

**Mandatory:**
- These must not be treated as free-form strings.
- Mutation of reference data must be admin-only.
- Deletion must be restrictive when records are referenced by feature requests.
- If these entities are required at startup, seed them through one deterministic mechanism: a data migration, an idempotent management command, or an explicit fixture strategy. Document which one is used.

**Forbidden:**
- Accepting free-form strings in place of validated reference IDs.
- Allowing unauthenticated or non-admin clients to create, update, or delete reference data.
- Relying on manual initial creation without documentation.

---

## 9. Anti-Patterns — Explicitly Forbidden

- **Business logic in views:** Any non-trivial workflow belongs in a service.
- **Serializer-centric workflow orchestration:** Complex business logic must not live in serializer `create()` or `update()`.
- **Frontend-oriented hacks in backend code:** The backend is not a servant of frontend convenience. It enforces rules unconditionally.
- **Missing database constraints for critical invariants:** Application-layer checks alone are insufficient. Vote uniqueness, field bounds, and uniqueness of reference data names require database constraints.
- **Undocumented API behavior:** Every field in every response must be intentional and aligned with the API contract.
- **Implicit permission logic:** Authorization must be explicit, named, and testable.
- **Ad hoc ranking logic in multiple places:** Ranking is defined once and computed in one place.
- **Client control of protected fields:** `author_id`, `vote_count`, `is_admin`, and admin-only status transitions must never be accepted from the client.
- **Scattered transition logic:** Status transition policy belongs in one place — a service or policy module.
