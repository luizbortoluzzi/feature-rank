# ADR-008: Reference Data as Admin-Controlled Seeded Entities

## Status

Accepted

## Context

Feature Rank uses three types of reference data that users interact with but do not create:

- **Categories** — classify feature requests (UI, Performance, API, Security, Developer Experience, Other)
- **Statuses** — represent the lifecycle state of a feature request (open, under review, planned, completed, rejected)
- **Roles** — define user permission levels (user, admin)

These entities have specific properties that distinguish them from user-generated content:
- Their values have semantic meaning at the application level (e.g., the backend explicitly checks for a status named `"open"` when creating a new feature request)
- They must exist before the application is usable
- Allowing arbitrary creation of these entities by users would break domain invariants
- Their count is small and their values are stable

The project needed a strategy for creating these entities that was reproducible, safe to run multiple times, and clear about who can modify them after initial creation.

## Decision

Reference data entities are:

**Modeled as first-class Django models** with proper database constraints (unique name, foreign key protections). They are not stored as enum fields or string constants in application code.

**Seeded via an idempotent management command** (`seed_reference_data`) that uses `get_or_create` for every record. Running it multiple times produces no duplicates. Running it on a fresh database produces the full expected set. The command creates:
- 2 roles: `user`, `admin`
- 6 categories with display metadata (icon name and hex color): UI, Performance, API, Security, Developer Experience, Other
- 5 statuses with ordering and terminal flags: open (sort 0), under review (sort 1), planned (sort 2), completed (sort 3, terminal), rejected (sort 4, terminal)
- 2 development-only user accounts (`admin@example.com`, `user@example.com`) for local development

A second command (`seed_demo_data`) creates a large realistic dataset (20 users, 60 feature requests, vote history) for demonstration purposes. This command is additive, not idempotent.

**Protected by foreign key constraints** (`on_delete=PROTECT`) on `FeatureRequest`. Deleting a category or status that is referenced by any feature request is rejected at the database level, not just the application layer.

**Mutable only by admins** after initial seeding. Category and status CRUD endpoints are admin-only. Standard users can read reference data (needed to populate form dropdowns) but cannot modify it.

**Referenced by name in services** where needed. The `create_feature_request` service looks up the `"open"` status by name (`Status.objects.get(name__iexact="open")`). This creates a dependency between the service and the seeded data. If `seed_reference_data` has not been run, feature creation fails with a validation error rather than silently.

## Consequences

**Benefits:**
- Reference data is always consistent. Any environment that has run `seed_reference_data` has exactly the categories and statuses the application expects.
- The idempotency of `seed_reference_data` means it can be included in a startup script or CI setup without risk.
- Modeling reference data as proper database entities (with id, color, icon, sort_order) allows the frontend to consume them directly from the API rather than hardcoding display attributes client-side.
- `on_delete=PROTECT` prevents silent data integrity violations — you cannot delete a category that is in use without first reassigning or deleting the feature requests that reference it.

**Trade-offs:**
- The application depends on seeded data being present. A freshly migrated database without seed data will fail to create feature requests. This dependency is explicit (the service raises a `ValidationError` with a message naming the missing seed command) rather than silent.
- Adding a new category or status requires updating the `seed_reference_data` command and re-running it (idempotent, so existing records are not affected). There is no migration for reference data.
- Using `get(name__iexact="open")` in the service creates a string dependency on a specific status name. If the name is ever changed in the seed data, the service must be updated simultaneously.

## Alternatives Considered

**Enum fields or string constants (no database table):** Categories and statuses stored as `CharField(choices=...)` on `FeatureRequest`. Simple, but cannot carry display metadata (color, icon, sort_order) without a parallel data structure. Also cannot be extended by an admin user at runtime. Rejected.

**Database migrations for reference data (data migrations):** Reference data created via a Django data migration rather than a management command. Ensures the data is always present after `migrate`. However, data migrations are harder to maintain — changing the seed data requires a new migration. The idempotent management command is simpler and more flexible.

**Admin-only API endpoint for bootstrapping:** First-run setup via an API call rather than a management command. Adds complexity, requires a sequence of authenticated API calls to set up a fresh environment, and is harder to automate in CI or container startup scripts. Rejected.

**Fixtures (JSON/YAML):** Django's built-in fixture loading via `loaddata`. Simple for small datasets, but fixtures are not idempotent by default and are fragile when primary keys change between environments. Management commands with `get_or_create` are more robust.

## Evidence

- `backend/apps/feature_requests/management/commands/seed_reference_data.py` — `get_or_create` for all records, dev users, docstring: *"Idempotent — safe to run multiple times"*
- `backend/apps/feature_requests/management/commands/seed_demo_data.py` — additive dataset: 20 users, 60 feature requests, realistic vote distribution
- `backend/apps/feature_requests/services.py` — `create_feature_request` calls `Status.objects.get(name__iexact="open")`, raises `ValidationError` with seed instruction if not found
- `backend/apps/feature_requests/models.py` — `FeatureRequest.category = ForeignKey(on_delete=PROTECT)`, `FeatureRequest.status = ForeignKey(on_delete=PROTECT)`
- `backend/apps/categories/views.py` and `backend/apps/statuses/views.py` — `IsAdminOrReadOnly` permission class on write endpoints
- `backend/apps/statuses/models.py` — `sort_order` (unique), `is_terminal` fields that carry semantic meaning consumed by the frontend and the service layer
- `Makefile` — `seed` target: `docker compose exec -T backend python manage.py seed_reference_data`; `seed-demo` target: `docker compose exec -T backend python manage.py seed_demo_data`
- `docs/architecture/backend-architecture.md` — Reference Data Strategy section
