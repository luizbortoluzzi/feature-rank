"""
Services for the statuses app.

Responsibilities (application layer):
- Non-trivial status reference data mutation workflows: create, update,
  safe deletion with reference checks

Design rules:
- Status transition logic for feature requests belongs in
  apps.feature_requests.services, not here.
- This service owns only the lifecycle of the Status reference entity itself.
- Deletion must check for references before proceeding (restrictive delete policy).

See docs/architecture/backend-architecture.md — Application Layer.
"""
