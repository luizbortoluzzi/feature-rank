# API Design

Defines how the frontend and backend communicate.

---

## Principles

- consistency over cleverness
- explicit behavior
- stable contracts
- predictable structure

---

## Base Response Format

Success:

```json
{
  "data": ...
}
```

Error:

```json
{
  "error": {
    "message": "string",
    "code": "string",
    "details": {}
  }
}
```

---

## Core Resources

### Roles

- `GET /roles/`

### Users

- `GET /users/me/`
- `GET /users/{id}/` (optional for admin/backoffice scenarios)

### Categories

- `GET /categories/`

### Statuses

- `GET /statuses/`

### Feature Requests

- `GET /feature-requests/`
- `POST /feature-requests/`
- `GET /feature-requests/{id}/`
- `PATCH /feature-requests/{id}/` (if editing is supported)
- `DELETE /feature-requests/{id}/` (if deletion is supported)

### Voting

- `POST /feature-requests/{id}/vote/`
- `DELETE /feature-requests/{id}/vote/` (if vote removal is supported)

---

## Suggested Feature Request Response Shape

```json
{
  "data": {
    "id": 123,
    "title": "Dark mode for dashboard",
    "description": "Allow users to switch dashboard theme",
    "rate": 4,
    "vote_count": 10,
    "has_voted": true,
    "author": {
      "id": 12,
      "name": "Jane Doe"
    },
    "category": {
      "id": 2,
      "name": "UI",
      "icon": "palette",
      "color": "#7C3AED"
    },
    "status": {
      "id": 1,
      "name": "Open",
      "color": "#2563EB"
    },
    "created_at": "2026-03-26T12:00:00Z",
    "updated_at": "2026-03-26T12:00:00Z"
  }
}
```

---

## Pagination

List endpoints MUST support pagination.

Example:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

---

## Sorting

Default sorting for feature requests should be explicit.

Recommended default order:

1. vote_count desc
2. created_at desc
3. id desc

Optional sort parameters may include:

- `sort=top`
- `sort=newest`
- `sort=oldest`

---

## Filtering

Feature request listing should support filtering by:

- category
- status
- author
- search term

Example query params:

- `?category_id=2`
- `?status_id=1`
- `?author_id=12`
- `?search=dark%20mode`

---

## Validation Errors

Validation errors must be structured and predictable.

Example:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "validation_error",
    "details": {
      "title": ["This field is required."],
      "rate": ["Must be between 1 and 5."]
    }
  }
}
```

---

## Status Codes

Use standard HTTP codes whenever possible:

- `200 OK`
- `201 Created`
- `204 No Content`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Unprocessable Entity` (optional if the team standard uses it)
- `500 Internal Server Error`

---

## Contract Discipline

Backend defines the contract.

Frontend consumes the contract.

Breaking changes must be coordinated and documented.
