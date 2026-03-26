"""
Domain models for the categories app.

Category is a controlled reference entity. It must not be treated as a free-form
string. Category names must be unique. Deletion is restrictive when records are
referenced by feature requests.

Fields to implement:
- name: unique category label
- icon: UI metadata (e.g. icon identifier string)
- color: UI metadata (e.g. hex color code)

UI metadata fields (icon, color) are permitted but must not drive core business
rules. They are presentation data only.

Seeding strategy: categories required at startup must be seeded through a single
deterministic mechanism. Document which one is used when implemented.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
"""

# Domain models will be implemented here.
