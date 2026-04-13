---
name: implement-django-models
description: Implement or update Django models safely and in full conformance with the repository's data modeling rules, domain invariants, and architectural constraints.
---

# Skill: implement-django-models

## Purpose

Implement or update Django models safely, correctly, and in full conformance with the repository's data modeling rules, domain invariants, and migration discipline. This skill governs all model-layer work inside `backend/`.

---

## When to Use

- When creating a new domain entity
- When adding or changing fields, relationships, constraints, or indexes on an existing model
- When updating model metadata (`Meta` class: ordering, `unique_together`, constraints, indexes)
- When creating or modifying a migration

Do not modify models without completing the required document reading below.

---

## Required Inputs

- A precise description of the modeling change: which entity, which fields, which constraints, which relationships

If the task is non-trivial, run `design-backend-feature` first and use its output as the input here.

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/engineering/backend/data-modeling.md` — canonical field definitions, types, length limits, nullability, `on_delete` behaviors, uniqueness constraints, access control per entity. This document governs every model decision. Read the section for every entity you are touching.
2. `docs/architecture/backend-architecture.md` — what belongs in models vs services vs serializers. Models define structure and DB constraints only.

**Read if applicable:**
- `docs/engineering/backend/security.md` — which fields must not be client-writable, which entities require ownership protection.
- `docs/domain/voting-rules.md` — if the change involves `Vote`, `vote_count`, or ranking.
- `docs/engineering/global/testing-strategy.md` — mandatory model-level test coverage before merge.

---

## Execution Steps

Execute every step in order. Do not skip steps. Do not write implementation code before Step 3 is complete.

### Step 1 — Identify affected entities and relationships

State explicitly:

```
Entities affected:
- <ModelName>: <what changes — fields, constraints, relationships, or "new model">
- <ModelName>: <references or is referenced by — cardinality and on_delete>
```

Verify every entity's canonical definition in `docs/engineering/backend/data-modeling.md`. Do not assume field names, types, nullability, or `on_delete` behavior — confirm from the document.

If the entity is not in the document and this is not a new entity, stop. Surface the discrepancy before proceeding.

### Step 2 — Extract field and constraint requirements from the doc

For every affected model, extract from `docs/engineering/backend/data-modeling.md`:

```
Model: <ModelName>
Fields:
  - <name>: <type>, max_length=<n>, null=<bool>, blank=<bool>, default=<val or "none">
Uniqueness constraints:
  - <fields>: <UniqueConstraint name>
Check constraints:
  - <description>: <CheckConstraint name>
Indexes:
  - <fields>: <reason — filter path, sort path>
ForeignKey on_delete:
  - <field>: <CASCADE / PROTECT / SET_NULL>
```

Do not implement any field, constraint, or index not in this list. Do not omit any that are defined.

### Step 3 — Verify domain semantics before writing code

Confirm each of the following. If any is violated by the required change, stop and surface before proceeding:

- `vote_count` is **never** stored on `FeatureRequest`. It is always derived via `Count('votes')` annotation. Adding a `vote_count` field is forbidden.
- `rate` on `FeatureRequest` is the author's self-assessed importance (1–5). It must never appear in any `order_by()` expression. Adding ordering logic that uses `rate` is forbidden.
- `author` on `FeatureRequest` is always derived from the authenticated session. It must never be client-writable.
- `is_admin` on `User` is set by backend logic only. It is never client-writable.
- The `Vote` model must have a `UniqueConstraint` on `(user, feature_request)`. This constraint must exist at the database level — application-layer checks alone are insufficient.

### Step 4 — Implement fields and relationships

Write or modify the model:

- Use the exact field types from Step 2 (`CharField`, `TextField`, `PositiveSmallIntegerField`, `ForeignKey`, etc.)
- Apply `max_length` exactly as specified — do not round up or change
- Apply `null=True` / `blank=True` only as the doc specifies — never add these for convenience
- Apply `default` only where documented or functionally required
- For every `ForeignKey` and `OneToOneField`, apply the `on_delete` behavior from Step 2 exactly
- Do not add `editable=False` to `auto_now` or `auto_now_add` fields — they are already non-editable

Models must not contain:
- Business workflow logic
- Authorization logic
- Request-aware behavior
- Multi-step side effects

### Step 5 — Implement constraints and indexes

In the model's `Meta` class, add:

- `UniqueConstraint` for every multi-field uniqueness rule
- `CheckConstraint` for every value range or enum rule (e.g., `rate` must be 1–5)
- `Index` for every field used in a filter or sort path that is not already indexed by `unique=True`
- `ordering` only if explicitly documented — do not set arbitrary default ordering

The mandatory `Vote` uniqueness constraint:
```python
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['user', 'feature_request'],
            name='unique_vote_per_user_per_feature'
        )
    ]
```

This constraint must be present. It is a critical domain invariant.

### Step 6 — Handle lifecycle fields

If the model includes timestamp fields:
- `created_at`: `auto_now_add=True` — set once on creation, never updated, never writable
- `updated_at`: `auto_now=True` — updated on every save, never writable

Do not expose these as writable fields in serializers.

### Step 7 — Create the migration

After every model change, run:
```bash
python manage.py makemigrations <app_name>
```

Inspect the generated migration file and verify:
- It reflects only the changes made in this task — no unintended changes from other models
- All constraints and indexes from Step 5 appear in the migration
- The migration is reversible, or document explicitly why it is not
- No `RunPython` or data migration is included unless this task requires it

Do not squash or alter existing migrations unless explicitly required by the task.

### Step 8 — Identify and record downstream impact

After completing the model change, identify every downstream file that must be updated:

```
Downstream impact:
- Serializers: <which fields must be added/removed from Meta.fields, read_only_fields, etc.>
- Services: <which creation/update logic references changed fields>
- Selectors: <which annotations, filters, or prefetch calls reference changed fields>
- Tests: <which factories, fixtures, or test setup reference changed fields>
- API contract: <if a new field appears in responses, it must be documented>
```

If a downstream change is outside the scope of this task, surface it explicitly as a required follow-up. Do not leave downstream files silently inconsistent.

### Step 9 — Name the required tests

Before declaring the model work complete, name every test that must exist:

```
Tests required:
- <test_name>: <what it verifies> [model/service/API]
```

Mandatory categories:
- Field constraint enforcement: uniqueness, value ranges, required fields
- `on_delete` behavior for every FK (cascade or protection)
- Domain invariant checks: `vote_count` not stored on model, `rate` not used in ordering
- Vote uniqueness: `test_vote_uniqueness_constraint_prevents_duplicate` — must use the real DB, not mocks

---

## Expected Output

- Correct model implementation aligned with `docs/engineering/backend/data-modeling.md`
- All required constraints at the database level
- Migration file reflecting only the required changes
- Downstream impact list
- Named test cases

---

## Failure Conditions

Stop immediately and write `BLOCKED:` if:

- A required field type, constraint, or `on_delete` in the doc cannot be implemented as specified
- The change requires adding a stored `vote_count` field — this is forbidden by the domain rules
- The change requires using `rate` in an `order_by()` expression — this is forbidden
- A uniqueness constraint required by the domain cannot be expressed as a database constraint
- The migration would destructively alter existing data — do not run it without surfacing this first

---

## Anti-Patterns — Forbidden

- Adding a `vote_count` field to `FeatureRequest`
- Adding `rate` to any ordering expression
- Making `author`, `vote_count`, or `is_admin` client-writable in any way
- Enforcing uniqueness only at the application layer without a database constraint
- Placing business workflow logic or authorization logic inside model methods
- Adding `null=True` or `blank=True` to fields not documented as optional
- Setting `Meta.ordering` without explicit documentation justification
- Skipping migration creation after any model change
- Squashing existing migrations without explicit instruction

---

## References

- `docs/engineering/backend/data-modeling.md`
- `docs/architecture/backend-architecture.md`
- `docs/engineering/backend/security.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/rules/backend-rules.md`
- `.claude/agents/backend-engineer.md`
