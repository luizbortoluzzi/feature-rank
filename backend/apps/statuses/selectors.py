"""
Selectors for the statuses app.

Responsibilities (query layer):
- Reusable read patterns: status list queries, status lookup by id or name

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""
