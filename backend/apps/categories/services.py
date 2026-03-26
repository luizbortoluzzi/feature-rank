"""
Services for the categories app.

Responsibilities (application layer):
- Non-trivial category mutation workflows: create, update, safe deletion
  with reference checks

Design rules:
- Deletion must check for references before proceeding (restrictive delete policy).
- Services accept explicit arguments and return predictable outcomes.

See docs/architecture/backend-architecture.md — Application Layer.
"""
