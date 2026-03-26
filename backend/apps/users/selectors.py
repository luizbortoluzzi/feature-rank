"""
Selectors for the users app.

Responsibilities (query layer):
- Complex or reusable read patterns: filtered user lists, annotated queries,
  user lookup by identifier variants
- Reusable prefetch/select_related compositions for user-related data

Design rules:
- Selectors are strictly read-only. They must never mutate state.
- Non-trivial queryset logic that would otherwise be repeated across views
  belongs here, not inline in views.
- Use select_related and prefetch_related explicitly for all known related
  objects to avoid N+1 queries.

See docs/architecture/backend-architecture.md — Query Layer.
"""
