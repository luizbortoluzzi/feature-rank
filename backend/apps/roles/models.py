"""
Domain models for the roles app.

Role is a controlled reference entity. It must not be treated as a free-form
string. Role names must be unique. Deletion is restrictive when records are
referenced.

Seeding strategy: roles required at startup must be seeded through a single
deterministic mechanism — a data migration, idempotent management command, or
explicit fixture strategy. Document which one is used when implemented.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
"""

# Domain models will be implemented here.
