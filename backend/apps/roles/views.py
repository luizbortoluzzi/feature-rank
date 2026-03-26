"""
Views for the roles app.

Responsibilities (transport layer):
- Role reference data endpoints (list, detail) — read-only for authenticated users
- Mutation endpoints (create, update, delete) — admin-only

Design rules:
- Views must remain thin. Permission checks, serializer invocation, and
  service/selector delegation only. No business logic.
- Mutation of reference data must be admin-only. Non-admin clients must not
  be able to create, update, or delete roles.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
"""
