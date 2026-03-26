"""
Domain models for the statuses app.

Status is a controlled reference entity representing the lifecycle state of a
feature request. It must not be treated as a free-form string. Status names must
be unique. Deletion is restrictive when records are referenced by feature requests.

Fields to implement:
- name: unique status label (e.g. "Under Review", "Planned", "Rejected")
- color: UI metadata for rendering status badges
- is_terminal: boolean indicating whether this is a final lifecycle state

Key domain rule:
- Voting is permitted on feature requests in any status, including terminal
  statuses. Status does not gate vote eligibility.
- is_terminal is UI/display metadata. It does not alter backend vote or ranking
  behavior.

Status transition policy is centralized in the feature_requests service layer,
not scattered across views or serializers.

Seeding strategy: statuses required at startup must be seeded through a single
deterministic mechanism. Document which one is used when implemented.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
See docs/domain/voting-rules.md for voting behavior across statuses.
"""

# Domain models will be implemented here.
