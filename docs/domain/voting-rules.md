# Voting Rules

This document is the authoritative specification for voting behavior in the Feature Voting System.

All backend implementations must conform exactly to the rules defined here. Frontend validation is for UX only — it does not replace or override backend enforcement. When any other document conflicts with this one on voting behavior, this document takes precedence.

This document aligns with and must remain consistent with:
- `docs/domain/feature-voting.md` — domain semantics and invariants
- `docs/engineering/backend/data-modeling.md` — schema and constraint definitions
- `docs/engineering/backend/security.md` — security posture and enforcement requirements

---

## 1. Voting Model

A **Vote** is a binary expression of interest by a user in a feature request.

Casting a vote means: "I want this feature." A vote carries no weight, no priority level, and no sentiment beyond that declaration.

**Structure:**
- Votes are binary. A user either has a vote on a feature request or does not. There is no partial vote, fractional vote, or vote magnitude.
- There is no weighting system. No user attribute — role, `is_admin`, account age, activity level, or any other factor — affects the value of a vote.
- One vote from any user equals one vote from any other user. This is unconditional.

**Explicit rules:**
- A user may cast at most one vote per feature request. This limit is absolute and enforced unconditionally.
- A user may vote on their own feature request. Self-voting is permitted and treated identically to any other vote.
- Casting a vote on a feature the user has already voted on is not an error. The vote operation is idempotent.
- A user may remove their vote. After removal, the user may vote again. There is no cool-down or re-vote restriction.
- Removing a vote from a feature the user has not voted on is not an error. The unvote operation is idempotent.

---

## 2. Vote Constraints

The uniqueness of votes is enforced at two mandatory layers.

### Service Layer (Application)

Before attempting a vote insert, the backend checks whether a `Vote` record already exists for the `(user_id, feature_request_id)` pair. If a record exists, the insert is skipped and the current state is returned as a successful response.

### Database Layer

A unique composite constraint on `(user_id, feature_request_id)` in the `Vote` table is mandatory. This constraint is not optional. It must be present as a database-level constraint, not only as application logic.

Its purpose is to handle concurrent requests that bypass the application check simultaneously. If two concurrent requests from the same user both pass the service-layer check before either completes, the database constraint prevents a duplicate vote from being committed.

### Enforcement Hierarchy

The service layer is the primary guard. The database constraint is the concurrency safety net. Both are required. Neither alone is sufficient.

**Rules:**
- Duplicate vote attempts must not create new `Vote` records under any condition, including concurrent requests.
- A database integrity violation caused by a concurrent duplicate insert must be caught by the service layer and returned as a successful idempotent response — not as a 500 error, not as a 409.
- The system must remain consistent under concurrent vote attempts from the same user.

---

## 3. Vote Lifecycle

### Vote Creation (Voting)

When an authenticated user submits a vote on feature request `{id}`:

1. If `{id}` does not reference an existing feature request: return `404 Not Found`.
2. Check whether a `Vote` record exists for `(user_id, feature_request_id)`.
3. If no vote exists: create the `Vote` record.
4. If a vote already exists: skip the insert.
5. In both cases: return `200 OK` with `has_voted: true` and the current `vote_count`.

Creating a vote that already exists is a no-op. It is not an error.

### Vote Removal (Unvoting)

When an authenticated user submits an unvote on feature request `{id}`:

1. If `{id}` does not reference an existing feature request: return `404 Not Found`.
2. Check whether a `Vote` record exists for `(user_id, feature_request_id)`.
3. If a vote exists: delete the `Vote` record.
4. If no vote exists: skip the delete.
5. In both cases: return `200 OK` with `has_voted: false` and the current `vote_count`.

Removing a vote that does not exist is a no-op. It is not an error.

### Re-voting

After removing a vote, a user may vote again on the same feature request. There is no restriction on voting again after an unvote.

### Voting and Feature Request Status

Voting is permitted on feature requests regardless of their current status. The `is_terminal` flag on a `Status` record does not block voting. A user may vote on or unvote a feature request in any status, including `completed` or `rejected`.

---

## 4. Concurrency Rules

The system must be safe under concurrent vote requests from the same user. Scenarios that must be handled correctly:

- repeated UI taps without debouncing
- rapid client retries after a network failure
- simultaneous requests from multiple browser tabs
- mobile reconnects that replay pending actions
- request replay from retry middleware

**Mandatory:**
- The database unique constraint on `(user_id, feature_request_id)` must be present. It is the concurrency safety net.
- When a constraint violation occurs at the database level due to concurrent inserts, the service layer must catch the integrity error and return `200 OK` as if the vote already existed.

**Explicitly forbidden:**

The following pattern must not be used as the sole protection against duplicate votes:

```
1. Check if vote exists
2. If not, insert vote
```

Without the database constraint, two concurrent requests can both pass the existence check and both attempt an insert. One will succeed and one will either produce a duplicate or raise an unhandled error. The database constraint must always be present alongside any application-layer check.

**Acceptable patterns:**
- Application check followed by insert, backed by the database constraint as safety net.
- Transactional get-or-create backed by the database constraint.
- Insert and catch integrity error, return idempotent response on conflict.

---

## 5. Ranking Rules

Feature requests are ordered by the following criteria, applied in strict priority sequence:

| Priority | Field        | Direction  |
|----------|--------------|------------|
| 1        | `vote_count` | Descending |
| 2        | `created_at` | Descending |
| 3        | `id`         | Descending |

**Rules:**
- This ordering is mandatory for the default feature list. It is not a suggestion.
- Every tie at priority 1 is resolved by priority 2. Every tie at priority 2 is resolved by priority 3.
- `id` is unique. Priority 3 always resolves the tie. The ordering is fully deterministic. There are no unresolved ties.
- Ranking is defined and computed by the backend. The frontend must not sort, reorder, or override the data returned by the API.
- Client-side sorting of fetched data is not a substitute for server-side ordering.
- No randomness is introduced at any step.

**Examples:**
- A feature with 10 votes appears above one with 9 votes.
- Among features with equal vote counts, the newer one appears first.
- Among features with equal vote counts and equal `created_at` timestamps, the one with the higher `id` appears first.

**Sort overrides:**
Clients may override the primary sort field using the `sort` query parameter. See `api-conventions.md` for permitted sort values and tie-breaker behavior. The `id desc` tie-breaker is always applied last regardless of sort override.

---

## 6. Vote Count Definition

`vote_count` is the count of `Vote` records currently associated with a feature request.

**Rules:**
- `vote_count` is derived data. It is computed at query time by aggregating `Vote` records — not stored on the `FeatureRequest` model.
- `vote_count` must not be stored on `FeatureRequest` unless a denormalization decision is explicitly documented separately.
- `vote_count` must not be controlled, set, or overridden by the client under any condition. If a client sends `vote_count` in any request body, it is rejected or silently stripped — never applied.
- `vote_count` must reflect the actual count of `Vote` records at the time of the response. It must be consistent with database state.
- Votes from deactivated users remain in the database and continue to count toward `vote_count`. Deactivating a user does not remove or invalidate their existing votes.

---

## 7. Rate Interaction

`rate` and `vote_count` are separate, independent concepts. They must not be conflated.

| Concept      | Meaning                                         | Source       | Effect on Ranking |
|--------------|-------------------------------------------------|--------------|-------------------|
| `vote_count` | Number of users with an active vote             | Vote records | Yes — primary sort |
| `rate`        | Author's self-assessed importance (1 = lowest, 5 = highest) | Author input | None — ever |

**Rules:**
- `rate` must never appear in any sort or ordering expression for the feature list at any layer.
- `rate` does not contribute to `vote_count`.
- `rate` does not aggregate, weight, or modify any ranking signal.
- If a future requirement introduces rate-based ordering, it must be documented as a new explicit rule in this document and in `feature-voting.md`. It does not follow from the current model.

---

## 8. Authorization Rules

### Who Can Vote

- Only authenticated users may vote or unvote. Unauthenticated users are rejected with `401 Unauthorized`.
- A user may vote on any feature request, including their own.
- There are no role-based restrictions on voting. Admins are subject to the same one-vote-per-feature constraint as all other users.

### Vote Ownership on Removal

- A user may only remove their own vote.
- The backend determines ownership using the authenticated user's identity from the request context — not from any client-supplied `user_id`.
- A user cannot remove another user's vote. There is no endpoint or mechanism that allows this.

### Identity Source

- The backend derives the acting user's identity from the authentication token or session.
- The client never supplies `user_id` in the vote or unvote request body. If present, it is ignored.
- Frontend state is not accepted as proof of vote ownership or authorization.

---

## 9. API Behavior

### POST Vote

```
POST /api/features/{id}/vote/
```

- Authentication: required. Returns `401` if unauthenticated.
- Request body: empty.
- If `{id}` does not exist: returns `404 Not Found` with `not_found` error code.
- If the user has not voted: creates the vote, returns `200 OK`.
- If the user has already voted: does nothing, returns `200 OK`.
- Both vote cases return the same response shape.

Response:

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

### DELETE Vote (Unvote)

```
DELETE /api/features/{id}/vote/
```

- Authentication: required. Returns `401` if unauthenticated.
- Request body: none.
- If `{id}` does not exist: returns `404 Not Found` with `not_found` error code.
- If the user has voted: deletes the vote, returns `200 OK`.
- If the user has not voted: does nothing, returns `200 OK`.
- Both unvote cases return the same response shape.
- Returns `200 OK` with a response body, not `204 No Content`. This is an explicit exception to the general delete rule.

Response:

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

### has_voted Flag

All feature request responses — list and detail — include a `has_voted` boolean field.

- `true` if the authenticated user has a `Vote` record for that feature request.
- `false` if the user has no vote, or if the request is unauthenticated.
- For unauthenticated requests, `has_voted` is always `false`.

### Status Code Reference for Voting

| Scenario                              | Status |
|---------------------------------------|--------|
| Vote (first time)                     | 200    |
| Vote (already voted)                  | 200    |
| Unvote (vote existed)                 | 200    |
| Unvote (no vote existed)              | 200    |
| Feature request not found             | 404    |
| Unauthenticated                       | 401    |
| Concurrent duplicate (DB constraint)  | 200    |

No error status is returned for idempotent voting operations.

---

## 10. System Invariants

These rules hold unconditionally at all times, across all actors and all code paths.

| #  | Invariant |
|----|-----------|
| 1  | A user holds at most one vote per feature request. Duplicates are never created under any condition, including concurrent requests. |
| 2  | Voting is idempotent. Repeated vote attempts do not create duplicate records and do not return errors. |
| 3  | Unvoting is idempotent. Repeated unvote attempts on a feature with no existing vote do not return errors. |
| 4  | `vote_count` reflects the actual count of `Vote` records for a feature request at the time of the response. |
| 5  | The default feature list ordering is: `vote_count` desc → `created_at` desc → `id` desc. This has no exceptions in the current model. |
| 6  | Ranking is fully determined by the backend. No client-side sort or reorder is authoritative. |
| 7  | `rate` does not influence ranking or `vote_count` under any condition. |
| 8  | All votes carry equal weight. No user attribute affects vote value. |
| 9  | Only authenticated users may vote or unvote. |
| 10 | A user may only remove their own vote. The backend enforces this from the authenticated session, not from client-supplied data. |
| 11 | Editing a feature request (title, description, category, rate, or status) does not modify, remove, or invalidate any votes. |
| 12 | Deleting a feature request removes all its associated votes. |
| 13 | Deactivating a user does not remove or invalidate their existing votes. Those votes continue to count. |
| 14 | Voting is permitted on feature requests in any status, including terminal statuses. |
| 15 | The backend is the sole source of truth for vote state. Frontend state is for display only. |

---

## 11. Anti-Patterns

The following behaviors are explicitly forbidden. Any implementation that exhibits these behaviors is incorrect.

### Multiple Votes Per User

A user creating more than one `Vote` record for the same `(user_id, feature_request_id)` pair is a data integrity violation. It must be prevented by both the service layer and the database unique constraint. Neither layer alone is sufficient.

### Client-Controlled vote_count

The client must never supply `vote_count` in any request body. If received, it must be rejected or silently stripped — never applied. `vote_count` is computed from the database, not accepted from the client.

### Non-Deterministic Ranking

Any sort order that can produce different orderings for the same dataset is forbidden. The three-level sort — `vote_count` desc, `created_at` desc, `id` desc — must be applied exactly as defined. Randomness, shuffling, and undefined sort behavior are forbidden.

### Check-Then-Insert Without Database Constraint

Using an existence check followed by an insert, without a database-level unique constraint as backup, is forbidden. This pattern is not safe under concurrent requests and will eventually produce duplicate votes or unhandled database errors. The database constraint must always be present.

### Frontend-Only Enforcement

Relying on frontend state, local storage, cached vote data, or any client-side mechanism as the authoritative source of vote state is forbidden. The backend must perform its own checks. Frontend state is for rendering only.

### Rate Influencing Ranking

Using `rate` in any sort or ordering expression — at any layer, in any query, annotated field, or derived signal — is forbidden. `rate` must never appear in an ORDER BY clause applied to the feature list.

### Vote Weighting

Assigning any multiplier, priority factor, or differential weight to a vote based on any user attribute (role, `is_admin`, tenure, reputation) is forbidden in the current model. Every vote counts as exactly 1.

### Anonymous Voting

Unauthenticated users cannot vote. No endpoint accepts a vote without a verified authenticated identity. Guest voting and anonymous voting are not supported.

### Removing Another User's Vote

A user may only delete their own `Vote` record. The backend must verify vote ownership using the authenticated session identity before deletion. This check must not rely on a client-supplied `user_id`. No actor other than the vote's owner may delete a vote through the API.
