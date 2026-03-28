# ADR-002: Equal-Weight Vote-Count Ranking Model

## Status

Accepted

## Context

The central purpose of Feature Rank is to produce a reliable ranking of feature requests that reflects user interest. The ranking model determines what "most wanted" means and directly affects every user's experience of the system.

Several dimensions required a decision:

1. **What unit is counted?** Individual votes, or some weighted or scored value derived from votes?
2. **Does user identity affect vote weight?** Should admins, power users, or long-tenured users carry more influence?
3. **Does the author's self-assessed importance (`rate`) affect ranking?** The model includes a 1–5 `rate` field set by the feature author.
4. **How are ties broken?** Equal vote counts must produce a stable, deterministic order.
5. **Is voting reversible?** Can users remove a vote?

Each choice has consequences for system complexity, fairness perception, and implementation risk.

## Decision

**Ranking is based exclusively on the count of distinct votes per feature request.** This means:

- Each authenticated user has exactly one vote per feature. No user attributes (role, tenure, `is_admin`) affect the weight of their vote.
- The `rate` field is the author's personal importance assessment. It is a display attribute only. It does **not** appear in any `ORDER BY` expression, ranking computation, or sort parameter. This constraint is enforced at the selector level and in the API contract.
- The default feature list ordering is: `vote_count DESC → created_at DESC → id DESC`. The tertiary `id DESC` key makes ordering fully deterministic — no two rows can occupy the same position regardless of tie depth.
- Voting is **idempotent**: casting a vote on a feature already voted on returns `200 OK` without creating a duplicate. Removing a vote that does not exist also returns `200 OK`.
- Voting is permitted on features in any status, including terminal statuses (`completed`, `rejected`). Closing a feature request does not invalidate expressed interest.
- `vote_count` is never stored on the `FeatureRequest` model. It is computed at query time via `COUNT` aggregation. This avoids the consistency maintenance problem that comes with a denormalized counter.

## Consequences

**Benefits:**
- The ranking is transparent and easy to explain: the most-voted feature ranks first.
- Equal-weight voting is perceived as fair. No user group has privileged influence.
- Excluding `rate` from ranking prevents authors from gaming the system by self-assigning high importance to move their own features up.
- Idempotent vote operations simplify client-side error handling — network retries are safe by design.
- Computing `vote_count` at query time via annotation means the count is always accurate. There is no risk of the counter drifting from the actual `Vote` row count.
- Deterministic tie-breaking via `created_at DESC → id DESC` ensures the list is stable across identical requests. Clients can rely on this order.

**Trade-offs:**
- Annotating `vote_count` on every list query adds a `COUNT` aggregation to the queryset. At scale, this may require an index strategy or eventual denormalization (which would need to be documented as a new ADR).
- Equal-weight voting means a highly active user and a first-time user carry identical influence. This is intentional for fairness but may be revisited if the product evolves toward role-based moderation.
- `rate` being present in the data model but excluded from ranking may be confusing to new contributors. The constraint is documented in the selector docstring, the model docstring, and the backend rules.

## Alternatives Considered

**Weighted voting (admin votes count more):** Adds complexity, creates perceived unfairness among non-admin users, and requires ongoing policy decisions about what attributes affect weight. Rejected.

**Scoring that incorporates `rate`:** The `rate` field reflects author preference, not community preference. Including it in ranking gives authors outsized control over their own features' visibility. Rejected. `rate` remains a display attribute only.

**Stored `vote_count` counter (denormalized):** Faster reads, but requires an atomic increment/decrement strategy and introduces the risk of the counter diverging from actual `Vote` records under concurrent operations or failed transactions. Not warranted at this scale without an explicit performance bottleneck.

**Non-reversible voting:** Allowing unvoting makes the system more honest — a user who changes their mind can retract support. The idempotent `DELETE /api/v1/features/{id}/vote/` endpoint makes this safe without complexity.

## Evidence

- `backend/apps/feature_requests/selectors.py` — `VALID_SORT_VALUES` excludes `rate`; `SORT_MAP` always ends with `-id` for full determinism; `vote_count` annotated via `Count("votes", distinct=True)`
- `backend/apps/feature_requests/models.py` — `Vote.Meta.unique_together = [("user", "feature_request")]`; no `vote_count` field on `FeatureRequest`
- `backend/apps/feature_requests/services.py` — `vote_feature_request` uses `get_or_create`; `unvote_feature_request` uses queryset `.delete()` (safe for zero matches); `IntegrityError` caught and returned as idempotent success
- `backend/config/settings/base.py` — `has_voted` annotated via `Exists()` subquery in selector
- `docs/domain/voting-rules.md` — authoritative voting behavior specification
- `docs/architecture/backend-architecture.md` — constraint strategy and ordering requirements
- Selector docstring: *"rate must NEVER appear in any ORDER BY expression"*
- Model docstring: *"rate is author self-assessment only and must NEVER appear in any sort expression"*
