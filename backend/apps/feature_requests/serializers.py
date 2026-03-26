"""
Serializers for the feature_requests app.

Responsibilities:
- Input validation and payload shaping for feature request create/update
- Output representation for API responses (list, detail)
- Protected field policy: author_id, vote_count, status_id must not be
  client-controllable in non-admin flows

Serializer split strategy (to be implemented with domain models):

Read serializers:
- FeatureRequestSummarySerializer: used in list responses
  Fields: id, title, description, rate, vote_count, has_voted, author (summary),
          category (summary), status (summary), created_at, updated_at
- FeatureRequestDetailSerializer: used in detail responses (same shape initially,
  may diverge as richer detail is added)

Write serializers:
- FeatureRequestCreateSerializer: writable fields for creation
  Writable: title, description, rate, category_id
  Derived from context: author (from request.user)
  Never writable: status_id (assigned to default on create), vote_count, author_id
- FeatureRequestUpdateSerializer: writable fields for editing (author or admin)
  Writable: title, description, rate, category_id
  Admin-only: status_id (handled by a separate status change action)

Nested representations:
- AuthorSummarySerializer: { id, name } — no email, no sensitive fields
- CategorySummarySerializer: { id, name, icon, color }
- StatusSummarySerializer: { id, name, color, is_terminal }

See docs/architecture/backend-architecture.md — Serializers.
See docs/engineering/backend/api-conventions.md for response field standards.
"""
