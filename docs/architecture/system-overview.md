# System Overview

This document is the primary architectural reference for the Feature Voting System. All other documentation, implementation decisions, and agent-driven code generation must align with the definitions and constraints stated here. When this document conflicts with another, this document takes precedence — or both must be updated together.

---

## 1. System Purpose

### What it is

A web-based product feedback tool that allows authenticated users to submit feature requests, browse submitted requests, upvote them, and see requests ranked by popularity. Administrators manage the lifecycle of requests through controlled status transitions.

### What problem it solves

Product teams and user communities need a structured, transparent way to collect and prioritize feature demand. This system replaces ad hoc channels (Slack, email, spreadsheets) with a canonical, vote-weighted ranking that reflects actual user interest.

### What it is NOT

- Not a bug tracker or issue management system
- Not a comment thread or discussion platform
- Not a real-time notification system
- Not a recommendation engine
- Not a rating aggregator — the `rate` field is user sentiment data, not a ranking signal
- Not a public anonymous submission tool — all writes require authentication

### What success looks like

- Feature requests are submitted and browsable with no friction
- Ranking reflects real vote distribution, is deterministic, and never produces inconsistent ordering
- A user cannot manipulate the system by voting multiple times
- Admins have exclusive control over lifecycle state
- The API contract is stable and the frontend has no knowledge of backend business rules

---

## 2. Actors

### Anonymous User

Can:
- Browse the public feature request list (read-only)
- View individual feature request details

Cannot:
- Submit a feature request
- Vote or unvote
- Change status
- Access user-specific data (e.g., `has_voted` is always `false`)

### Authenticated User

Can:
- Submit new feature requests
- Edit their own feature requests (title, description, category, rate)
- Vote on any feature request (including their own)
- Remove their own vote
- Browse the full list with personalized `has_voted` state

Cannot:
- Vote more than once per feature request
- Edit or delete another user's feature request
- Change the status of any feature request
- Assign themselves a role

### Admin User

Can:
- Do everything an authenticated user can
- Change the status of any feature request
- Manage reference data (categories, statuses, roles) if admin endpoints are exposed
- Access admin-scoped representations where applicable

Cannot:
- Bypass vote integrity rules (one vote per user per feature)
- Perform actions not explicitly exposed via API

> Role assignment and admin privileges are backend-enforced. The frontend must not infer or grant elevated capabilities based on locally held assumptions.

---

## 3. Core Domain Concepts

### FeatureRequest

The central entity. Represents a product improvement idea submitted by an authenticated user.

Fields:
- `id` — unique identifier
- `title` — short description of the request
- `description` — detailed explanation
- `rate` — user-assigned importance signal (integer, 1–5); does not affect ranking
- `vote_count` — computed dynamically from related `Vote` records; never stored on the record
- `has_voted` — per-authenticated-user boolean; computed at query time
- `author` — the user who created it; set by the backend from the authenticated session
- `category` — reference to a controlled `Category` entity
- `status` — reference to a controlled `Status` entity
- `created_at`, `updated_at`

Why it exists: it is the primary subject of all user interaction — submission, browsing, voting, and lifecycle management.

### Vote

A relationship record asserting that a specific user has upvoted a specific feature request.

Fields:
- `user` — FK to the user who cast the vote
- `feature_request` — FK to the target feature request
- `created_at`
- Unique constraint on `(user_id, feature_request_id)`

Why it exists: it is the sole mechanism for expressing popularity. Vote count drives ranking.

Important distinction — **vote vs rate**:
- A vote is a binary signal of interest (one per user per feature, drives ranking).
- A rate is a 1–5 sentiment score (one per submission, does not drive ranking).
These are separate concepts. `rate` must never appear in the sort expression.

### User

An authenticated identity in the system. Not a domain entity the user manages directly — it is the identity layer.

Relevant attributes:
- unique identity
- assigned role
- active/inactive status

A deactivated user's votes remain in the database and continue to count toward `vote_count`. User deactivation does not cascade to vote removal.

### Role

A controlled reference entity that classifies user capability level (e.g., regular user, admin).

Why it exists: it gates access to admin-only actions such as status changes and reference data management. Free-form strings are not used; roles are a managed set.

### Category

A controlled reference entity that classifies a feature request by domain area (e.g., UI, Performance, API).

Why it exists: it enables filtering and browsing by domain. Categories are admin-managed, not user-defined strings. Feature requests must reference a valid, existing category.

Category has optional UI metadata (icon, color) that may inform display — but must not drive business rules.

### Status

A controlled reference entity representing the lifecycle stage of a feature request (e.g., Open, Under Review, Planned, Rejected, Completed).

Why it exists: it communicates product intent to users and gives admins explicit control over the lifecycle. Status transitions are admin-only and must be intentional, not side effects.

Important distinction — **category vs status**:
- Category is a static classification of what the feature is about (domain).
- Status is a dynamic lifecycle state that changes over time based on admin decisions.
These are independent dimensions and must not be conflated.

---

## 4. High-Level Architecture

### Monorepo Structure

```
feature-rank/
├── frontend/     # React + TypeScript application (Vite)
├── backend/      # Django REST API
├── docs/         # Authoritative specifications and architectural decisions
└── .github/      # CI/CD workflow definitions
```

### Frontend — `frontend/`

Technology: React, TypeScript, Vite.

Responsibilities:
- Render UI and manage local UI state
- Send API requests and render responses
- Handle loading, error, and empty states
- Enforce UX-level validation (not business-rule validation)

Constraints:
- Is a consumer of the API contract — it does not define it
- Must not embed backend business logic (vote uniqueness, status permissions, ranking)
- Must not derive or infer user capabilities beyond what the API communicates
- Treats API responses as the single source of truth for all data

### Backend — `backend/`

Technology: Django, Django REST Framework.

Responsibilities:
- Own all business logic and data integrity rules
- Expose a stable, RESTful API
- Enforce authentication, authorization, and validation
- Compute `vote_count` and `has_voted` at query time
- Enforce vote uniqueness via both application logic and database constraint
- Restrict status transitions to admin users

Layer structure:
- **Transport layer** (views/viewsets): HTTP concerns, auth, permission checks, serializer invocation
- **Application layer** (services): mutation workflows, orchestration, transaction boundaries
- **Query layer** (selectors): complex reads, annotated querysets, reusable filters
- **Domain/data layer** (models): field definitions, relationships, database constraints

The backend is the source of truth for all state. It is never a pass-through.

### Docs — `docs/`

Docs are a first-class system component, not supplementary material.

Responsibilities:
- Define authoritative rules that implementations must conform to
- Record architectural decisions and their rationale
- Prevent ambiguity for engineers and AI agents working in this codebase

When implementation and docs diverge, the discrepancy must be resolved explicitly — not silently ignored.

---

## 5. Core System Flows

All flows are backend-driven. The frontend initiates requests; the backend enforces rules and returns authoritative responses.

### 5.1 Create Feature Request

1. Authenticated user submits `POST /feature-requests/` with title, description, category, and rate.
2. Backend validates: all required fields present, category exists, rate is 1–5.
3. Backend derives `author` from the authenticated session — the client does not supply it.
4. Backend creates the record and returns the full feature request representation.
5. `status` defaults to the system's initial status (e.g., "Open") — the client does not set it.

### 5.2 View and Rank Features

1. Client sends `GET /feature-requests/` (with optional filter/sort query params).
2. Backend builds an annotated queryset: computes `vote_count` via `COUNT` of related `Vote` rows.
3. Ordering is applied in strict priority:
   1. `vote_count` descending
   2. `created_at` descending
   3. `id` descending
4. For authenticated requests, `has_voted` is annotated per row from the current user's vote records.
5. Paginated response is returned. All list responses are paginated — no unbounded queries.

`rate` has no effect on ordering. Ever.

### 5.3 Vote on Feature

1. Authenticated user sends `POST /feature-requests/{id}/vote/`.
2. Backend checks: feature request exists.
3. Backend checks: user has not already voted (application-level check).
4. If no existing vote: inserts `Vote` record. Returns `200 OK` with current state.
5. If vote already exists (duplicate): returns `200 OK` with current state. No error. No duplicate insert.
6. If concurrent duplicate insert causes a DB constraint violation: backend catches it and returns `200 OK`.

Vote is idempotent. Repeated calls to vote on an already-voted feature are safe and return the same shape.

### 5.4 Unvote a Feature

1. Authenticated user sends `DELETE /feature-requests/{id}/vote/`.
2. Backend checks: feature request exists.
3. If vote exists: deletes it. Returns `200 OK`.
4. If no vote exists: returns `200 OK`. No error.

Unvote is idempotent. The response is stable regardless of prior vote state.

### 5.5 Change Feature Status

1. Admin user sends a status update request (e.g., `POST /feature-requests/{id}/change-status/` or `PATCH`).
2. Backend checks: caller has admin role. Non-admin requests are rejected with `403`.
3. Backend validates: target status exists and the transition is permitted.
4. Backend applies the status change within a transaction.
5. Response returns the updated feature request representation.

This flow is never accessible to regular authenticated users. The frontend must not expose status-change UI to non-admins, but the backend enforces this independently.

---

## 6. System Invariants

These rules are non-negotiable. They must hold at all times, across all code paths, for all actors.

| # | Invariant |
|---|-----------|
| 1 | A user can cast at most one vote per feature request. Enforced at application layer and by DB unique constraint on `(user_id, feature_request_id)`. |
| 2 | The backend is the sole enforcer of all business rules. Frontend validation is UX-only. |
| 3 | Status changes are restricted to admin users. No code path allows a regular user to change status. |
| 4 | Ranking is deterministic. The ordering `vote_count desc, created_at desc, id desc` resolves all ties. No unresolved ordering ambiguity exists. |
| 5 | The API is the only interface to state changes. No direct database access, no backdoor mutations. |
| 6 | `rate` does not affect ranking. It must not appear in any sort expression for the feature list. |
| 7 | `author` is derived from the authenticated session on creation. The client cannot supply or override it. |
| 8 | Editing a feature request does not modify or remove existing votes. |
| 9 | A deactivated user's votes remain valid and count toward `vote_count`. |
| 10 | Deleting a feature request cascades to delete all related votes. |

---

## 7. Non-Goals

The following are explicitly out of scope for the current system. They must not be assumed, implemented speculatively, or designed around.

- **Comments** — no threaded or flat comment system on feature requests
- **Notifications** — no email, push, or in-app notification system
- **Real-time updates** — no WebSocket or polling-based live feed
- **Recommendation engine** — no personalized or ML-driven feature suggestions
- **Anonymous submissions** — all writes require authentication; read-only anonymous access is the ceiling for unauthenticated users
- **Downvotes** — only upvotes exist; there is no negative voting
- **Vote weighting** — all votes are equal regardless of user role or activity
- **Audit trail** — no event log or change history is required at this stage
- **Attachments** — no file or image upload on feature requests
- **Social features** — no follows, mentions, or reactions beyond voting
