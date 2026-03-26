# Data Modeling

This document defines the canonical data model for the Feature Voting System backend.
It is authoritative. Implementations must match this specification exactly.
Deviations require an explicit update to this document before the implementation is merged.

---

## Principles

- Application-level checks are the primary enforcement layer. The database schema enforces constraints as the final safety net, particularly for concurrency. Both layers are required.
- Foreign keys for required references are non-nullable.
- Derived data (e.g., `vote_count`) is computed via aggregation, not stored, unless explicitly documented otherwise.
- Reference data (Role, Category, Status) is admin-managed. It is not free-form input from end users.
- Every entity includes `created_at`. Mutable entities include `updated_at`. Vote is immutable; it has no `updated_at`.

---

## Entity Definitions

### Role

Represents the product-level permission grouping for a user.

| Field      | Type         | Constraints               |
|------------|--------------|---------------------------|
| id         | integer (PK) | auto-increment            |
| name       | varchar(50)  | required, unique          |
| created_at | timestamp    | required, auto-set on create |

**Rules:**
- `name` is required, unique, and max 50 characters.
- Roles are pre-defined and seeded at deployment. The admin API does not expose role create, update, or delete endpoints. Role management is performed via Django admin or seed scripts only.
- Initial roles: `admin`, `member`.
- Role deletion is restricted when any User references the role.

**No API endpoints.** Roles are managed via Django admin or seed scripts only.

---

### User

Represents an authenticated system user.

| Field      | Type         | Constraints                        |
|------------|--------------|------------------------------------|
| id         | integer (PK) | auto-increment                     |
| name       | varchar(150) | required                           |
| email      | varchar(254) | required, unique (case-insensitive)|
| is_admin   | boolean      | required, default `false`          |
| role_id    | FK → Role    | required, non-nullable             |
| is_active  | boolean      | required, default `true`           |
| created_at | timestamp    | required, auto-set on create       |
| updated_at | timestamp    | required, auto-set on update       |

**Rules:**
- `name` is the user's display name (full name or preferred name). It is not a unique username. Two users may share the same display name. It is required and max 150 characters.
- `email` is required, max 254 characters (RFC 5321 limit), and unique across all users. Uniqueness is case-insensitive. The backend normalizes email to lowercase before storing and before uniqueness checks.
- `role_id` is required. A user must always have an assigned role. The `role_id` FK is defined with `on_delete=PROTECT`.
- `is_admin` grants elevated administrative capability (status changes, reference data management). It is independent of `role_id`.
- `role_id` represents the user's product/business role.
- `is_active = false` deactivates a user. Deactivated users cannot authenticate. Their votes and feature requests remain in the database.
- Hard deletion of users is not permitted through the standard API. User removal is performed exclusively by setting `is_active = false`. Hard deletion, if ever required, is a backend-only admin operation performed outside the API.

**Self-update field restriction:** A user may update only their own `name` and `email` fields. The fields `is_admin`, `role_id`, and `is_active` are admin-only. Password management (if applicable) is outside this contract.

**Indexes:**
- Unique index on `email`
- Index on `role_id`

---

### Category

Represents the classification of a feature request.

| Field      | Type          | Constraints              |
|------------|---------------|--------------------------|
| id         | integer (PK)  | auto-increment           |
| name       | varchar(100)  | required, unique         |
| icon       | varchar(100)  | required                 |
| color      | varchar(7)    | required, format #RRGGBB |
| created_at | timestamp     | required, auto-set on create |

**Rules:**
- `name` is required, unique, and max 100 characters.
- `icon` is a string identifier (e.g., icon name from an icon library). It is required and max 100 characters.
- `color` is a hex color string. It is required, must match the format `#RRGGBB` exactly, and is exactly 7 characters.
- Categories are admin-managed reference data. End users cannot create, update, or delete categories.
- Category deletion is restricted when any FeatureRequest references it.

---

### Status

Represents the lifecycle state of a feature request.

| Field       | Type         | Constraints              |
|-------------|--------------|--------------------------|
| id          | integer (PK) | auto-increment           |
| name        | varchar(100) | required, unique         |
| color       | varchar(7)   | required, format #RRGGBB |
| is_terminal | boolean      | required                 |
| sort_order  | integer      | required, unique         |
| created_at  | timestamp    | required, auto-set on create |
| updated_at  | timestamp    | required, auto-set on update |

**Rules:**
- `name` is required, unique, and max 100 characters.
- `color` is a hex color string. It is required, must match the format `#RRGGBB` exactly, and is exactly 7 characters.
- `is_terminal` is `true` for final states (`completed`, `rejected`). Terminal statuses signal that the feature request lifecycle is closed.
- `sort_order` is an integer used for stable UI ordering. Lower values appear first. Required; no two statuses share the same `sort_order`.
- Statuses are admin-managed reference data. End users cannot create, update, or delete statuses.
- Status changes on a feature request are restricted to admin users.
- Status deletion is restricted when any FeatureRequest references it.
- Initial statuses (with their `sort_order` values): `open` (sort_order=0), `planned` (sort_order=1), `in_progress` (sort_order=2), `completed` (sort_order=3), `rejected` (sort_order=4). The numbers in parentheses are the `sort_order` values.

---

### FeatureRequest

Represents a product improvement suggestion submitted by a user.

| Field        | Type              | Constraints                          |
|--------------|-------------------|--------------------------------------|
| id           | integer (PK)      | auto-increment                       |
| title        | varchar(255)      | required                             |
| description  | text              | required, min 1 non-whitespace char  |
| rate         | integer           | required, range 1–5                  |
| author_id    | FK → User         | required, non-nullable               |
| category_id  | FK → Category     | required, non-nullable               |
| status_id    | FK → Status       | required, non-nullable               |
| created_at   | timestamp         | required, auto-set on create         |
| updated_at   | timestamp         | required, auto-set on update         |

**Rules:**
- `title` is required and max 255 characters.
- `description` is required. It is a text field with no maximum length, but it must contain at least 1 non-whitespace character.
- `rate` is required. It must be an integer between 1 and 5 inclusive. `rate` uses a 1–5 scale where 1 = lowest importance/urgency and 5 = highest. This is the author's self-assessment only and has no effect on ranking. It must never be used in sort expressions for the feature list. Enforced at the database level via a `CHECK` constraint where supported, and at the serializer level.
- `author_id` is required and non-nullable.
- `category_id` is required and non-nullable. The `category_id` FK is defined with `on_delete=PROTECT`.
- `status_id` is required and non-nullable. The default status on creation is `open`. The `status_id` FK is defined with `on_delete=PROTECT`.
- `vote_count` is a computed value derived from the count of related `Vote` records. It is not stored on this model.
- Editing `title`, `description`, `category_id`, or `rate` does not remove or modify existing votes.
- Changing `status_id` does not affect votes. Status changes are restricted to admin users.
- Deleting a feature request cascades to delete all related `Vote` records.

**Indexes:**
- Index on `author_id`
- Index on `category_id`
- Index on `status_id`
- Index on `created_at`
- Composite index on `(status_id, created_at)` for filtered list queries

---

### Vote

Represents a user's upvote on a feature request.

| Field              | Type                | Constraints                          |
|--------------------|---------------------|--------------------------------------|
| id                 | integer (PK)        | auto-increment                       |
| user_id            | FK → User           | required, non-nullable               |
| feature_request_id | FK → FeatureRequest | required, non-nullable               |
| created_at         | timestamp           | required, auto-set on create         |

**Rules:**
- `user_id` is required and non-nullable. The `user_id` FK is defined with `on_delete=CASCADE` at the Django model level.
- `feature_request_id` is required and non-nullable. The `feature_request_id` FK is defined with `on_delete=CASCADE` at the Django model level.
- A unique composite constraint on `(user_id, feature_request_id)` is required. This is a database-level constraint, not only application-level.
- A user may vote only once per feature request.
- A user may vote on their own feature request.
- Vote is immutable. There are no update operations on this entity. It has no `updated_at` field. The only operations are create (vote) and delete (unvote).

**Indexes:**
- Unique index on `(user_id, feature_request_id)` — also serves as the uniqueness constraint
- Index on `feature_request_id` for vote count aggregation
- Index on `user_id`

---

## Relationship Summary

```
Role         1 ──< N   User
User         1 ──< N   FeatureRequest  (as author)
User         1 ──< N   Vote
Category     1 ──< N   FeatureRequest
Status       1 ──< N   FeatureRequest
FeatureRequest 1 ──< N Vote
```

---

## Schema Constraints Summary

The following constraints must be present in the database schema:

| Table          | Constraint                                       |
|----------------|--------------------------------------------------|
| User           | UNIQUE on `email` (case-insensitive)             |
| Role           | UNIQUE on `name`                                 |
| Category       | UNIQUE on `name`                                 |
| Status         | UNIQUE on `name`                                 |
| Status         | UNIQUE on `sort_order`                           |
| FeatureRequest | CHECK `rate` BETWEEN 1 AND 5                     |
| FeatureRequest | NOT NULL on `author_id`, `category_id`, `status_id` |
| Vote           | UNIQUE on `(user_id, feature_request_id)`        |
| Vote           | NOT NULL on `user_id`, `feature_request_id`      |

---

## Access Control by Entity

| Entity         | Create        | Read                                        | Update                                  | Delete        |
|----------------|---------------|---------------------------------------------|-----------------------------------------|---------------|
| Role           | No API endpoint | No API endpoint                           | No API endpoint                         | No API endpoint |
| User           | system/admin  | self/admin                                  | self: name, email only / admin: all fields | admin only |
| Category       | admin only    | all                                         | admin only                              | admin only    |
| Status         | admin only    | all                                         | admin only                              | admin only    |
| FeatureRequest | authenticated | all                                         | author/admin*                           | author/admin  |
| Vote           | authenticated | Embedded in FeatureRequest responses only. No standalone vote read endpoint. | not allowed | voter only |

*Status field on FeatureRequest: admin only. All other fields: author or admin.

**Note on Role:** Roles have no API endpoints. They are pre-defined and seeded at deployment. Role management is performed via Django admin or seed scripts only.

---

## Aggregation Strategy

`vote_count` is computed via Django ORM annotation using `Count('votes')` on list and detail queries.

No denormalized counter field exists on `FeatureRequest` in the initial implementation.
If a `vote_count_cache` field is added in the future, it must be documented in a separate ADR and kept consistent transactionally.

---

## Deletion Strategy

| Entity         | Deletion Behavior                                              |
|----------------|----------------------------------------------------------------|
| Role           | Restricted — cannot delete while users are assigned to it (`on_delete=PROTECT`) |
| User           | Hard deletion of users is not permitted through the standard API. User removal is performed exclusively by setting `is_active = false`. Hard deletion, if ever required, is a backend-only admin operation performed outside the API. |
| Category       | Restricted — cannot delete while feature requests reference it (`on_delete=PROTECT`) |
| Status         | Restricted — cannot delete while feature requests reference it (`on_delete=PROTECT`) |
| FeatureRequest | Cascades — deletes all related votes. Vote cascade deletion is enforced at the database level via `on_delete=CASCADE` on the Vote model's `feature_request_id` FK. |
| Vote           | Hard delete; no cascade implications                          |
