# Post-Implementation Hook

## Trigger

Run after completing implementation and before declaring work complete. "Complete" means every file has been written, every test has been written, and the change is ready to be reviewed or merged.

Do not declare the work done until every section of this checklist passes.

---

## Step 1 — Documentation Alignment

The docs are authoritative. Implementation must match them — not the other way around.

For every document read during the pre-implementation phase, verify:

- [ ] No documented field name, type, constraint, or behavior was silently deviated from.
- [ ] No new behavior was introduced that is not in the governing documents.
- [ ] If the implementation required behavior the docs do not define, the ambiguity was surfaced and not silently resolved.

### If implementation diverges from docs:

There are only two acceptable resolutions:

1. **Fix the implementation** to match the docs.
2. **Update the docs** because the implementation reflects a better or corrected understanding — and the change is intentional, not accidental.

Silently leaving implementation and docs in conflict is not acceptable.

**Check explicitly:**
- [ ] `docs/engineering/backend/api-conventions.md` — response envelope, status codes, field names
- [ ] `docs/domain/voting-rules.md` — vote behavior, ranking, concurrency rules
- [ ] `docs/engineering/backend/data-modeling.md` — field definitions, constraints, indexes
- [ ] `docs/architecture/system-overview.md` — system invariants
- [ ] Any other document consulted in the pre-implementation phase

---

## Step 2 — Architecture Compliance

### For backend changes:

- [ ] Business logic is in services, not in views or serializers.
- [ ] Complex read logic is in selectors, not in views.
- [ ] Models define fields and constraints only. No workflow orchestration.
- [ ] Every write endpoint has an explicit, named permission class.
- [ ] Object-level ownership checks are present where required (edit, delete, status change).
- [ ] `vote_count` is computed via annotation (`Count('votes')`). Not stored on `FeatureRequest`. Not writable by clients.
- [ ] `author_id` is assigned from the authenticated session. Not a writable serializer field.
- [ ] `status_id` is not writable by non-admin users.
- [ ] `rate` does not appear in any `order_by()` expression.
- [ ] Ranking order is `vote_count DESC, created_at DESC, id DESC` — no deviation.
- [ ] Vote uniqueness is enforced at two layers: service check + DB unique constraint on `(user_id, feature_request_id)`.
- [ ] Concurrent duplicate vote triggers `IntegrityError` → caught → returned as `200 OK`.
- [ ] Unvote with no existing vote → returns `200 OK`.
- [ ] Multi-step mutations are wrapped in transactions.
- [ ] Error responses use the documented envelope: `{ "error": { "code", "message", "details" } }`.
- [ ] No stack traces, raw DB error messages, or internal model names in any error response.
- [ ] List endpoints are paginated. No unbounded querysets.
- [ ] `select_related` and `prefetch_related` are used for all known related objects.

### For frontend changes:

- [ ] All HTTP calls are in `services/`. No `axios` or `fetch` in components, hooks, or utilities.
- [ ] All directories use `kebab-case`. All component entry points are `index.tsx`.
- [ ] Feature-specific hooks are in `features/<domain>/hooks/`, not in the top-level `hooks/`.
- [ ] Server state is in TanStack Query only. No copies in `useState`, `useRef`, or Context.
- [ ] `AuthContext` is the only Context that holds API data.
- [ ] Query keys are defined as constants, not inline strings.
- [ ] `useState(false)` is not used for loading state that TanStack Query already tracks.
- [ ] After mutations (except vote/unvote), the relevant query key is invalidated and refetched.
- [ ] Vote/unvote uses the defined optimistic update: snapshot → estimate → send → overwrite with `VoteResponse` → rollback on failure.
- [ ] Feature list is rendered in API response order. No `Array.sort()` applied.
- [ ] `rate` is not used in any sort, filter, rank, or ordering expression.
- [ ] `author_id` and `status_id` are not present in non-admin form payloads.
- [ ] No `any` in TypeScript. All props have typed interfaces. API types use `snake_case`.
- [ ] Every async-dependent component handles all three states: loading (`Spinner`/skeleton), error (`ErrorMessage`), empty (`EmptyState`).

---

## Step 3 — Quality and Risk Checks

These checks apply regardless of layer.

### Scope control

- [ ] Only the files listed in the pre-implementation plan were modified.
- [ ] No unrelated code was refactored, cleaned up, or reorganized.
- [ ] No new abstractions were introduced that are not used in more than one place.
- [ ] No backwards-compatibility shims, unused variable renames, or removed-code comments were added.

### Security

- [ ] No secrets, credentials, tokens, or internal configuration are present in any new or modified file.
- [ ] No raw DB errors, stack traces, or internal model names appear in API responses.
- [ ] Client-controlled fields (`author_id`, `vote_count`, `status_id` in non-admin flows) are either read-only or stripped before use.
- [ ] Every protected endpoint has an explicit permission class — not implicit defaults.

### API contract

- [ ] If a response field was added, changed, or removed: all frontend consumers have been identified and updated.
- [ ] If an endpoint's status code changed: the change is consistent with `docs/engineering/backend/api-conventions.md` and the frontend handles the new code.
- [ ] No undocumented field appears in any API response.

### Cross-layer consistency (if applicable)

- [ ] Frontend and backend are in sync on the contract. The frontend does not expect a field the backend does not return.
- [ ] The backend does not return a field the frontend does not know how to handle.
- [ ] No partial state exists where one layer reflects the new behavior and the other still reflects the old.

---

## Step 4 — Testing Completeness

Compare the test list from the pre-implementation plan against what was actually written.

### For backend changes, confirm these specific behaviors have tests:

- [ ] Vote uniqueness: duplicate vote does not create a second record.
- [ ] Vote idempotency: repeated vote call returns `200 OK` with unchanged state.
- [ ] Unvote idempotency: unvote with no existing vote returns `200 OK`.
- [ ] Ranking: `vote_count DESC` ordering is verified; `rate` does not affect ordering.
- [ ] Admin-only status change: non-admin returns `403`.
- [ ] `author_id` cannot be client-supplied.
- [ ] `vote_count` is not writable by clients.
- [ ] Unauthenticated access to protected endpoints returns `401`.
- [ ] Input validation: invalid `rate`, missing required fields, invalid FK references return `400` with `error.details`.
- [ ] Negative paths: unauthorized access, missing resources, duplicate operations.

### For frontend changes, confirm these specific behaviors have tests (where applicable):

- [ ] Loading state is rendered while data is fetching.
- [ ] Error state is rendered on API failure with appropriate message.
- [ ] Empty state is rendered when list is empty.
- [ ] Vote button is disabled during in-flight mutation.
- [ ] Optimistic update rolls back on failure.
- [ ] `rate` is not used in any ordering or sort expression.
- [ ] `author_id` and `status_id` do not appear in non-admin form submission payloads.

### Missing tests are blocking

If a test required by `docs/engineering/global/testing-strategy.md` was not written, the work is not complete. Either write the test or explicitly document why it cannot be written, and surface it as a known gap.

---

## Step 5 — Final Consistency Check

Answer each question:

1. Is there any file where implementation and documentation are now inconsistent?
2. Is there any test case that was identified as required but was not written?
3. Is there any negative path (invalid input, unauthorized access, concurrent operation, missing resource) that has no handling and no test?
4. Is there any async-dependent frontend component that does not handle all three states?
5. Is there any cross-layer inconsistency where frontend and backend are out of sync?
6. Did any part of the implementation require a decision that was not covered by the docs? If so, was the decision documented?

If any answer is "yes", resolve it before declaring the work complete.

---

## Step 6 — Prompt Logging

This step is blocking. The work is not complete until the prompt is logged.

- [ ] The current prompt has been appended to `PROMPT_HISTORY.md` at the project root.
- [ ] The entry uses the required format: `## [timestamp] – <summary>`, `### Prompt` with full content, `### Action Taken` with a concise description.
- [ ] The timestamp is ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- [ ] The full prompt content is logged — not truncated, summarized, or paraphrased.
- [ ] No existing entries were modified.
- [ ] The entry was appended, not inserted in the middle.

**If the prompt has not been logged, do not declare the work complete.**

---

## Output

After completing this checklist, produce:

```
POST-IMPLEMENTATION REVIEW
==========================
Documentation alignment: [pass / divergence found — describe]
Architecture compliance: [pass / violation found — describe]
Scope adherence: [pass / out-of-scope changes found — describe]
Security check: [pass / issue found — describe]
API contract consistency: [pass / mismatch found — describe]
Cross-layer consistency: [pass / out of sync — describe / N/A]
Tests written: [list]
Tests missing: [list or "none"]
Known gaps: [list or "none"]
Verdict: [complete / incomplete — reason]
```

If verdict is "incomplete", state exactly what must be done before the work is ready.
