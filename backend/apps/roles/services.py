"""
Services for the roles app.

Responsibilities (application layer):
- Non-trivial role mutation workflows: create role, update role name/metadata,
  safe deletion with reference checks

Design rules:
- Service functions are the boundary for business logic around reference data.
- Deletion must check for references before proceeding (restrictive delete policy).
- Services accept explicit arguments and return predictable outcomes.

See docs/architecture/backend-architecture.md — Application Layer.
"""
