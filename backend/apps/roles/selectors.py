"""
Selectors for the roles app.

Responsibilities (query layer):
- Reusable read patterns: role list queries, role lookup by name or id

Design rules:
- Selectors are strictly read-only. They must never mutate state.
- Queryset logic that would otherwise be repeated across views belongs here.

See docs/architecture/backend-architecture.md — Query Layer.
"""
