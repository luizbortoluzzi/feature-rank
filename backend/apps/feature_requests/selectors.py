"""
Selectors for the feature_requests app.

Responsibilities (query layer):
- Feature request listing with filters, annotations, and efficient loading
- vote_count annotation using DB aggregation (not serializer-level computation)
- has_voted annotation for authenticated list/detail views
- Deterministic ordering: vote_count desc -> created_at desc -> id desc
- Reusable prefetch/select_related composition to avoid N+1 queries

Critical ordering rule:
The default feature list ordering is strictly:
    vote_count DESC -> created_at DESC -> id DESC
This is mandatory and non-negotiable. rate must never appear in any ORDER BY
expression.

Query efficiency requirements:
- select_related: author, category, status (all known related objects)
- annotate: vote_count using Count('votes') or equivalent
- annotate: has_voted using Exists() or similar subquery when user is known
- Add database indexes for actual filter/sort patterns in production paths

Selector functions to implement:
- get_feature_request_list(user, filters): paginated annotated queryset
- get_feature_request_detail(id, user): single annotated instance or 404
- get_feature_request_for_update(id, user): fetch with ownership context

Design rules:
- Selectors are strictly read-only. They must never mutate state.
- Do not compute vote_count per-row inside serializers. Annotate on the queryset.
- Repeated queryset logic across views must be extracted here, not duplicated.

See docs/architecture/backend-architecture.md — Selectors, Query Design Strategy.
"""
