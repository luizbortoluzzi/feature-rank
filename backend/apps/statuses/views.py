"""
Views for the statuses app.

Responsibilities (transport layer):
- Status reference data endpoints (list, detail) — read-only for authenticated users
- Mutation endpoints (create, update, delete) — admin-only

Design rules:
- Views must remain thin. Permission checks, serializer invocation, and
  service/selector delegation only. No business logic.
- Status transition logic for feature requests belongs in
  apps.feature_requests.services, not here.
- Mutation of reference data must be admin-only.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
"""
