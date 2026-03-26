"""
Domain models for the feature_requests app.

This app owns:
- FeatureRequest model
- Vote model
- All relationships between them, and to User, Category, Status

Key domain invariants to enforce at the model/database layer:

FeatureRequest:
- author is always the authenticated user at creation time; never client-supplied
- rate must be in range 1..5 (enforced via serializer validation + db check constraint)
- category and status are foreign keys to controlled reference entities
- vote_count is NOT stored on FeatureRequest; it is annotated at query time
  (see selectors.py). Storing it would require a documented denormalization decision.
- Default ordering: vote_count desc -> created_at desc -> id desc (deterministic)

Vote:
- A user can cast at most one vote per feature request
- Uniqueness enforced at TWO layers:
    1. Service layer: existence check before insert
    2. Database layer: unique_together / UniqueConstraint on (user_id, feature_request_id)
  Both are required. The database constraint is the concurrency safety net.
- Votes carry equal weight regardless of user attributes
- Voting is permitted on feature requests in any status, including terminal ones

See docs/domain/voting-rules.md for authoritative voting behavior.
See docs/architecture/backend-architecture.md — Constraint Strategy.
"""

# Domain models will be implemented here.
