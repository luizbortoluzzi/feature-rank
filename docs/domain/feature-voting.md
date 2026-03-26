# Feature Voting Domain

This document is the authoritative definition of how the Feature Voting System behaves at the product and domain level. It defines what concepts mean, what rules govern them, and what invariants must always hold. It is not a UX guide. It is not an implementation reference. It defines the product.

All backend logic, frontend behavior, and data modeling must conform to the rules stated here. When an implementation decision is ambiguous, this document resolves it.

---

## 1. Feature Request Definition

A **FeatureRequest** is a user-submitted proposal for a product improvement.

It represents a problem a user wants solved or an idea a user believes would benefit the product. It is not a task, a ticket, or a technical specification. It does not describe how something should be implemented — it describes what the user wants and why.

### Required properties

A FeatureRequest is only valid when it has:

- a **title** — a concise statement of the request
- a **description** — an explanation of the need or desired outcome
- a **category** — exactly one classification from the controlled category set
- a **status** — exactly one lifecycle state from the controlled status set
- an **author** — the authenticated user who submitted it

A FeatureRequest with any of these properties absent is incomplete and must not be accepted.

### Authorship

The author is the user who created the request. Authorship is assigned at creation time from the authenticated session. It is immutable after creation. No other user may claim or reassign authorship.

### Ownership and editability

The author may edit the title, description, category, and rate of their own request. No other user (except an admin) may edit another user's request. Editing does not affect votes, vote count, or status.

---

## 2. Voting Semantics

A **Vote** is a binary expression of interest by a user in a feature request.

Casting a vote means: "I want this feature." Nothing more. A vote carries no weight, no priority level, and no sentiment beyond that declaration.

### Rules

- A user may cast at most **one vote per feature request**. This limit is absolute and enforced unconditionally.
- A user may vote on their own feature request. Self-voting is permitted and treated identically to any other vote.
- Casting a vote on a feature the user has already voted on is **not an error**. The system returns the current vote state unchanged. No duplicate vote is created.
- A user may **remove their vote** from a feature request. After removal, the user may vote again.
- Removing a vote from a feature the user has not voted on is **not an error**. The system returns the current state unchanged.

### Vote equality

All votes are equal. There is no weighting by user role, user activity, account age, or any other factor. One vote from any user equals one vote from any other user. This is unconditional.

### Vote count

`vote_count` is the total number of distinct users who have an active vote on a feature request. It is a count of Vote entities associated with the feature request. It is not stored on the feature request — it is computed from the Vote relationship.

---

## 3. Rate vs Vote Count

These are two separate, independent concepts. They must not be conflated.

### vote_count

- Represents **popularity** — how many users want this feature.
- Is derived from the count of Vote entities related to the feature request.
- **Determines ranking.** It is the primary signal for ordering the feature list.
- Is not set by the author. It is not editable. It reflects vote activity.

### rate

- Represents **perceived importance or urgency** as assessed by the author at submission time.
- Is an integer from 1 to 5, inclusive. 1 is lowest, 5 is highest.
- Is set by the author and may be edited by the author.
- **Does not affect ranking.** Rate must never appear in any ordering or sorting expression for the feature list.
- May be used in future filtering or internal analytics. That use is out of scope for MVP.

### The rule

Rate must not influence the ordering of feature requests. Ever. Under any condition. If a future requirement introduces rate-based ordering, it must be explicitly documented as a new rule — it does not follow from the current model.

---

## 4. Ranking Model

Feature requests are ordered by the following criteria, applied in strict priority sequence:

| Priority | Field        | Direction  |
|----------|--------------|------------|
| 1        | `vote_count` | Descending |
| 2        | `created_at` | Descending |
| 3        | `id`         | Descending |

### Rules

- This ordering is **mandatory** for the default feature list. It is not a suggestion.
- Every tie at priority 1 is resolved by priority 2. Every tie at priority 2 is resolved by priority 3.
- `id` is unique. Priority 3 always resolves the tie. There are no unresolved orderings.
- Ranking is defined by the backend. The frontend does not sort, reorder, or override the ranking returned by the API.
- No randomness is introduced at any step.
- Client-side sorting of fetched data is not permitted as a substitute for server-side ordering.

A feature with 10 votes appears above one with 9 votes. Among features with equal votes, the newer one appears first. Among features with equal votes and equal timestamps, the one with the higher id appears first.

---

## 5. Category Semantics

A **Category** is a classification that describes the domain area of a feature request.

Examples: UI, Performance, API, Accessibility, Security.

### Rules

- Every feature request must belong to **exactly one** category.
- Categories are a controlled set. They are not free-text strings entered by the author.
- A feature request cannot be submitted without a valid category.
- A category reference that does not exist in the system is invalid.

### What categories do

- Enable filtering of the feature list by domain area.
- Support organization and browsing.

### What categories do not do

- Categories do not affect ranking.
- Categories do not affect status transitions.
- Categories do not imply priority.

---

## 6. Status Semantics

A **Status** represents the **lifecycle stage** of a feature request. It communicates what the product team has decided about the request — not how popular it is.

### Defined lifecycle stages

| Status      | Meaning                                                        |
|-------------|----------------------------------------------------------------|
| Open        | Submitted and visible. No product decision has been made.      |
| Planned     | The product team intends to build this.                        |
| In Progress | Work on this feature has begun.                                |
| Completed   | The feature has been shipped.                                  |
| Rejected    | The product team has decided not to pursue this request.       |

### Rules

- Every feature request has exactly one status at all times.
- A newly created feature request is assigned the **Open** status.
- Only an **admin** may change the status of a feature request. Regular users cannot.
- Status transitions follow a controlled set of allowed progressions. Arbitrary transitions are not permitted.
- Status does not affect ranking in the MVP.

### What status communicates

Status is a signal of product intent. A request with 500 votes may be Rejected. A request with 1 vote may be Planned. Status and popularity are independent.

---

## 7. User Roles and Actions

### Normal User

A normal user is any authenticated user without elevated privileges.

Can:
- Submit feature requests
- Edit their own feature requests (title, description, category, rate)
- Vote on any feature request
- Remove their own vote from any feature request
- View the full feature list and individual request details

Cannot:
- Edit or delete another user's feature request
- Change the status of any feature request
- Create, edit, or delete categories
- Create, edit, or delete statuses
- Manage roles

### Admin User

An admin user has all capabilities of a normal user, plus:

Can:
- Change the status of any feature request
- Create, edit, and delete categories
- Create, edit, and delete statuses
- Manage roles and role assignments (if admin endpoints are available)

Admins cannot bypass vote integrity rules. An admin is subject to the same one-vote-per-feature constraint as any other user.

---

## 8. Feature Lifecycle

A feature request begins in the **Open** state and may transition to other states exclusively through admin action.

### Valid transitions

```
Open → Planned
Open → Rejected
Planned → In Progress
Planned → Rejected
In Progress → Completed
In Progress → Rejected
```

Transitions not listed above are not permitted unless explicitly added and documented.

### Rules

- Transitions are unidirectional as listed. There is no built-in rollback path (e.g., Completed → Open) unless explicitly defined.
- Only an admin may perform a transition.
- A transition that reaches a terminal state (Completed, Rejected) does not affect votes or vote count.
- The author of a feature request is not notified of status changes in the MVP.

---

## 9. System Invariants

These rules hold unconditionally, at all times, across all actors and all code paths.

| # | Invariant |
|---|-----------|
| 1 | A user may hold at most one vote per feature request. Duplicates are never created. |
| 2 | Voting and unvoting are idempotent. Repeated operations do not change state and do not produce errors. |
| 3 | The feature list is always ordered by: vote_count desc → created_at desc → id desc. This ordering has no exceptions in the MVP. |
| 4 | Ranking is fully determined by the backend. No client-side sort or reorder is authoritative. |
| 5 | Status changes are admin-only. No code path allows a regular user to change status. |
| 6 | Categories and statuses are controlled entities. Free-text values are never accepted. |
| 7 | Rate does not influence ranking or ordering under any condition. |
| 8 | All votes carry equal weight. No user attribute affects vote value. |
| 9 | Authorship is immutable after creation. It cannot be changed by any actor. |
| 10 | Editing a feature request does not modify, remove, or invalidate any votes. |

---

## 10. Non-Goals

The following behaviors are explicitly outside the scope of this system.

- **Weighted voting** — no mechanism exists to give any vote more weight than another
- **Anonymous voting** — voting requires authentication; unauthenticated users cannot vote
- **Comments or discussions** — feature requests have no attached thread or reply system
- **Recommendation algorithms** — no personalized or behavioral ranking exists
- **Automatic prioritization** — the system does not infer or assign priority; only vote count and submission time determine order
- **Downvotes or negative signals** — no mechanism exists to vote against a feature
- **Vote delegation** — users cannot transfer, share, or proxy their votes
- **Vote expiry** — votes do not expire or decay over time
- **Status-based ranking** — status does not affect position in the ranked list in the MVP
