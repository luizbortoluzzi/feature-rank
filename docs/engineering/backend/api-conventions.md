# API Conventions

This document is the authoritative specification for all REST API behavior in the Feature Voting System.
All backend endpoints must conform to the rules defined here.
Frontend integration must align with these contracts.

---

## Base URL

All API endpoints are prefixed with `/api/`.

---

## Response Format

Every API response uses a consistent JSON envelope.

### Success Response

```json
{
  "data": <object | array>,
  "meta": <object | null>
}
```

- `data` contains the primary payload (single object for detail endpoints, array for list endpoints).
- `meta` is `null` for all non-list responses, including vote/unvote responses and detail responses. `meta` is only non-null for paginated list responses.

### Error Response

```json
{
  "error": {
    "code": "<machine-readable string>",
    "message": "<human-readable string>",
    "details": <object | null>
  }
}
```

- `code` is a stable, machine-readable identifier (e.g., `"validation_error"`, `"not_found"`, `"unauthorized"`).
- `message` is a short human-readable explanation.
- `details` contains field-level errors for validation failures. It is `null` for non-validation errors.

**Validation error example:**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request body is invalid.",
    "details": {
      "title": ["This field is required."],
      "rate": ["Must be an integer between 1 and 5."]
    }
  }
}
```

---

## HTTP Status Codes

| Scenario                                      | Status Code |
|-----------------------------------------------|-------------|
| Successful read                               | 200         |
| Successful create                             | 201         |
| Successful update                             | 200         |
| Successful delete                             | 204         |
| Vote (first time or repeat)                   | 200         |
| Unvote (with or without prior vote)           | 200         |
| Validation failure                            | 400         |
| Unauthenticated                               | 401         |
| Authenticated but forbidden                   | 403         |
| Resource not found                            | 404         |
| Internal server error                         | 500         |

There are no `409 Conflict` responses. Duplicate vote attempts return `200 OK` due to idempotency.

**Note:** Vote and Unvote operations always return 200 regardless of whether a record was created or deleted. This is an explicit exception to the general create/delete rules, required by the idempotency contract.

---

## Pagination

All list endpoints return paginated results. Pagination is not optional.

### Query Parameters

| Parameter | Type    | Default | Description                      |
|-----------|---------|---------|----------------------------------|
| `page`    | integer | `1`     | Page number, 1-indexed           |
| `limit`   | integer | `20`    | Items per page, maximum `100`    |

### Pagination Boundary Behavior

- If `page` is less than 1: return 400 with `validation_error`.
- If `page` exceeds `total_pages`: return 200 with an empty `data` array and accurate `meta`. Do not return 404.
- If `limit` is less than 1 or greater than 100: return 400 with `validation_error`.

### Pagination Meta Object

```json
"meta": {
  "page": 1,
  "limit": 20,
  "total": 142,
  "total_pages": 8
}
```

- `total` is the total number of items matching the current filters.
- `total_pages` is `ceil(total / limit)`.

### Category and Status Pagination

Category and Status list endpoints are paginated using the same `page` and `limit` parameters. Pagination is not optional even for small reference data sets.

---

## Sorting

The default sort order for the feature request list is:

1. `vote_count` descending
2. `created_at` descending
3. `id` descending

This order is always applied. The `id` descending tie-breaker ensures the result is fully deterministic.

### Sort Override

Clients may override sort order using the `sort` query parameter.

**Permitted values:**

| Value         | Meaning                              |
|---------------|--------------------------------------|
| `-vote_count` | vote count descending (default)      |
| `vote_count`  | vote count ascending                 |
| `-created_at` | newest first (default secondary)     |
| `created_at`  | oldest first                         |

Only a single `sort` value is accepted. Comma-separated values (e.g., `sort=-vote_count,-created_at`) and repeated `sort` parameters are not supported. If multiple sort values are detected, return 400 with `validation_error`.

**Tie-breaker rules when a sort override is provided:**

- When the primary sort is `vote_count` or `-vote_count`: apply `created_at desc` as secondary and `id desc` as tertiary.
- When the primary sort is `created_at` or `-created_at`: apply only `id desc` as the tie-breaker. Since `created_at` is already the primary sort key, repeating it as a secondary is meaningless.

**Note:** When `sort=vote_count` (ascending), features with zero votes are sorted newest-first among themselves (secondary: `created_at desc`, tertiary: `id desc`). This is intentional and consistent with the tie-breaker rules.

`rate` is not a permitted sort field. Requests with `sort=rate` or `sort=-rate` return `400 Bad Request`.

---

## Filtering

List endpoints support the following query parameters for filtering:

| Parameter     | Type    | Description                                        |
|---------------|---------|----------------------------------------------------|
| `category_id` | integer | Filter by category                                 |
| `status_id`   | integer | Filter by status                                   |
| `author_id`   | integer | Filter by author                                   |

Filters are applied before sorting. Multiple filters are combined with AND.
Unknown filter parameters are ignored silently (not an error).

**Invalid filter value behavior:**
- If a known filter parameter contains a non-integer value (e.g., `category_id=abc`): return 400 with `validation_error`.
- If a known filter parameter references a non-existent record (e.g., `category_id=9999`): return 200 with an empty `data` array. Do not return 404.

---

## Response Object Shapes

The following nested object shapes are fixed contracts. Adding fields requires a documented API change.

- `author` in FeatureRequest responses: `{ id, name }` only. Email and other user fields are never included.
- `status` in FeatureRequest responses: `{ id, name, color, is_terminal }`.
- `category` in FeatureRequest responses: `{ id, name, icon, color }`.

---

## PATCH Semantics

PATCH is a partial update. Only fields present in the request body are updated. Omitting a field leaves it unchanged. A field omitted from a PATCH request is never validated as required.

---

## Authentication

- Authentication is via token (e.g., session token or JWT — implementation-specific).
- Unauthenticated requests to protected endpoints return `401 Unauthorized`.
- Authenticated requests to endpoints requiring elevated access (admin) return `403 Forbidden`.
- The authenticated user's identity is resolved server-side. The client never sends `user_id` directly.

**`status_id` admin-only rule:** `status_id` is an admin-only field across all endpoints. No non-admin request may set or change `status_id`, regardless of endpoint. If a non-admin submits `status_id` in any request body, it is rejected with 403.

---

## Roles

Roles have no API endpoints. They are managed via Django admin or seed scripts. The `/api/` surface does not expose role CRUD.

---

## Feature Request Endpoints

### List Feature Requests

```
GET /api/features/
```

**Query Parameters:** `page`, `limit`, `sort`, `category_id`, `status_id`, `author_id`

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Dark mode support",
      "description": "Add a dark mode toggle to the settings page.",
      "rate": 4,
      "vote_count": 38,
      "has_voted": true,
      "status": { "id": 1, "name": "open", "color": "#6B7280", "is_terminal": false },
      "category": { "id": 2, "name": "UI", "icon": "palette", "color": "#3B82F6" },
      "author": { "id": 5, "name": "Alice" },
      "created_at": "2026-01-10T14:23:00Z",
      "updated_at": "2026-02-04T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8
  }
}
```

- `vote_count` is the count of votes for the feature.
- `has_voted` is `true` if the authenticated user has voted for this feature, `false` otherwise. For unauthenticated requests, `has_voted` is always `false`.

### Retrieve Feature Request

```
GET /api/features/{id}/
```

**Response:** Same shape as a single item in the list response. `meta` is `null`.

### Create Feature Request

```
POST /api/features/
```

**Authentication:** Required.

**Request Body:**

```json
{
  "title": "Dark mode support",
  "description": "Add a dark mode toggle to the settings page.",
  "rate": 4,
  "category_id": 2
}
```

- `title`: required
- `description`: required
- `rate`: required, integer 1–5
- `category_id`: required, must reference an existing category

`status_id` is not accepted on create. New feature requests always receive the `open` status. If a non-admin submits `status_id`, it is rejected with 403.

`author_id` must never be accepted in the request body. If present, it is silently ignored — not treated as an error, and not used to reassign authorship. The author is derived from the authenticated user.

**Response:** `201 Created` with the created feature request object.

### Update Feature Request

```
PATCH /api/features/{id}/
```

**Authentication:** Required. Author or admin only.

**Updatable fields by role:**

| Field         | Author | Admin |
|---------------|--------|-------|
| `title`       | yes    | yes   |
| `description` | yes    | yes   |
| `rate`        | yes    | yes   |
| `category_id` | yes    | yes   |
| `status_id`   | no     | yes   |

`author_id` must never be accepted in the request body. If present, it is silently ignored — not treated as an error, and not used to reassign authorship.

Updating `title`, `description`, `rate`, or `category_id` does not modify votes.
Updating `status_id` does not modify votes.

**Response:** `200 OK` with the updated feature request object.

### Delete Feature Request

```
DELETE /api/features/{id}/
```

**Authentication:** Required. Author or admin only.

**Response:** `204 No Content`. All related votes are deleted via cascade. Vote cascade deletion on FeatureRequest delete is enforced at the database level via `on_delete=CASCADE` on the Vote model's `feature_request_id` FK. It is not performed in application code.

---

## Voting Endpoints

### Vote

```
POST /api/features/{id}/vote/
```

**Authentication:** Required.

**Request Body:** Empty. No body is required.

**Behavior:**
- If `{id}` does not reference an existing feature request, return 404 with `not_found` error code.
- If the user has not yet voted: create the vote.
- If the user has already voted: do nothing.
- Both cases return `200 OK`.

**Response:**

```json
{
  "data": {
    "feature_request_id": 1,
    "has_voted": true,
    "vote_count": 39
  },
  "meta": null
}
```

### Unvote

```
DELETE /api/features/{id}/vote/
```

**Authentication:** Required.

**Behavior:**
- If `{id}` does not reference an existing feature request, return 404 with `not_found` error code.
- If the user has voted: delete the vote.
- If the user has not voted: do nothing.
- Both cases return `200 OK`.

This is an explicit exception to the general delete → 204 rule. Unvote returns 200 with a body because the response contains the updated vote state.

**Response:**

```json
{
  "data": {
    "feature_request_id": 1,
    "has_voted": false,
    "vote_count": 38
  },
  "meta": null
}
```

---

## Reference Data Endpoints

Reference data (categories, statuses) is read-only for all non-admin users.
Write operations on reference data require admin authentication.
Roles have no API endpoints — see the Roles section above.

### Categories

```
GET  /api/categories/          → list all categories (public, paginated)
POST /api/categories/          → create category (admin only)
GET  /api/categories/{id}/     → retrieve category (public)
PATCH /api/categories/{id}/    → update category (admin only)
DELETE /api/categories/{id}/   → delete category (admin only, restricted if in use)
```

### Statuses

```
GET  /api/statuses/            → list all statuses (public, paginated)
POST /api/statuses/            → create status (admin only)
GET  /api/statuses/{id}/       → retrieve status (public)
PATCH /api/statuses/{id}/      → update status (admin only)
DELETE /api/statuses/{id}/     → delete status (admin only, restricted if in use)
```

---

## Field Naming

- All field names use `snake_case`.
- Timestamps are ISO 8601 UTC strings: `"2026-01-10T14:23:00Z"`.
- Boolean fields use `true` / `false`.
- Foreign key fields in request bodies use `_id` suffix (e.g., `category_id`).
- Foreign key fields in response bodies are expanded to nested objects (e.g., `"category": { "id": 2, "name": "UI", "icon": "palette", "color": "#3B82F6" }`).

---

## Prohibited Behaviors

- `rate` must never appear in a sort expression or be used to compute ranking.
- `author_id` must never be accepted from request body on create or update. If present, it is silently ignored.
- `status_id` must never be accepted from non-admin users. If a non-admin submits `status_id` in any request body, it is rejected with 403.
- Duplicate vote attempts must never return an error status.
- Missing vote on unvote must never return `404`.
- Pagination must never be skipped on list endpoints.
- The application layer checks for an existing vote before attempting an insert. The database unique constraint handles concurrent requests that bypass the application check. Both are required.
