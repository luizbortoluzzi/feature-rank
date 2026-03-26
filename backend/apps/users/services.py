"""
Services for the users app.

Responsibilities (application layer):
- Non-trivial user mutation workflows: account creation, profile update,
  deactivation
- Any workflow that touches more than a single model save belongs here, not
  in a view or serializer

Design rules:
- Service functions accept explicit typed arguments and return predictable outcomes.
- They must not accept or return HTTP request objects where avoidable.
- They enforce workflow rules (e.g., is_admin cannot be set by non-admin callers).
- They use transactions when multiple persistence steps must succeed or fail
  together.

See docs/architecture/backend-architecture.md — Application Layer.
"""
