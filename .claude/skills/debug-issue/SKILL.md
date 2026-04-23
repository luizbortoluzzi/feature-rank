---
name: debug-issue
description: Investigate and fix bugs systematically. Reconstruct expected behavior from docs, identify root cause, write the regression test before fixing, apply the smallest correct fix.
---

# Skill: debug-issue

## Purpose

Investigate and fix bugs by reconstructing expected behavior from documentation, comparing it to actual behavior, identifying the root cause precisely, writing a regression test before fixing, and applying the smallest correct fix.

Guessing is not investigation. The fix scope must match the root cause exactly — no broader.

---

## When to Use

- When observed behavior is broken, inconsistent, or surprising
- When a test fails unexpectedly
- When an API response shape or status code does not match the contract
- When a UI interaction does not behave as documented
- When a constraint (uniqueness, permission, ordering) is not being enforced

---

## Required Inputs

- Bug description: what was observed, in concrete terms (HTTP response body, UI state, error message, test output)
- Expected behavior: what should happen — either from documentation or from a failing test

If the expected behavior cannot be stated, read the relevant document before proceeding.

---

## Step 1 — Identify the affected layer

Classify the bug before doing anything else:

| Symptom | Layer |
|---|---|
| Wrong DB schema, missing constraint, wrong `on_delete` | Backend — model |
| Business rule not enforced, wrong transaction behavior, idempotency failure | Backend — service |
| Wrong HTTP status code, wrong response shape, missing auth check | Backend — view/permission |
| Wrong ordering, missing annotation, N+1 query | Backend — selector |
| Wrong endpoint called, wrong field sent, response not unwrapped | Frontend — service |
| Stale data, server state in `useState`, wrong cache invalidation | Frontend — state |
| Missing load/error/empty state, direct API call, wrong field displayed | Frontend — component |
| Both layers assume different contracts | Cross-layer — API contract |

State the layer explicitly:
```
Affected layer: <backend-model / backend-service / backend-view / backend-selector / frontend-service / frontend-state / frontend-component / cross-layer>
```

---

## Step 2 — Reconstruct expected behavior from documentation

Do not guess what the correct behavior is. Read the relevant document.

**For backend issues:**
- `docs/engineering/backend/api-conventions.md` — correct status codes, response shapes, error format
- `docs/domain/voting-rules.md` — vote/unvote idempotency, ranking rules, `rate` exclusion
- `docs/engineering/backend/security.md` — permission rules, protected fields
- `docs/engineering/backend/data-modeling.md` — constraints, field types, `on_delete`
- `docs/architecture/backend-architecture.md` — which layer owns which logic

**For frontend issues:**
- `docs/engineering/frontend/api-consumption.md` — data-fetching chain, service rules, optimistic update pattern
- `docs/engineering/frontend/state-management.md` — state ownership, what must not be duplicated
- `docs/engineering/frontend/ui-ux-guidelines.md` — required UX states
- `docs/architecture/frontend-architecture.md` — where logic belongs

**For cross-layer issues:**
- `docs/engineering/backend/api-conventions.md` — the contract both layers must match

State the expected behavior explicitly, with the document and section:
```
Expected behavior: <precise description>
Source: <document name, section>
```

If the document is silent on this behavior: write `DOC GAP:` and stop. Do not invent expected behavior.

---

## Step 3 — State the comparison precisely

```
Expected: <from Step 2>
Actual:   <exactly what was observed — HTTP status, response body, UI state, error>
Delta:    <the specific difference>
```

"The response is wrong" is not a delta. "Response status is `409` but contract requires `200 OK` for duplicate vote" is a delta.

---

## Step 4 — Identify the root cause

Read the code at the suspected failure point. Check each item below for the affected layer:

**Backend — view/permission:**
- Check: does the view contain ORM queries or queryset construction? (should be in selector)
- Check: does the view contain workflow logic? (should be in service)
- Check: is the permission class named, or is it inline conditional logic?
- Check: does the HTTP status code match `docs/engineering/backend/api-conventions.md`?
- Check: does the response follow the envelope `{ "data": ..., "meta": ... }`?

**Backend — service:**
- Check: is `IntegrityError` caught for concurrent duplicate vote inserts?
- Check: does duplicate vote return `200 OK` — not `409`, not an exception?
- Check: does missing vote on unvote return `200 OK` — not `404`?
- Check: is `transaction.atomic()` used where multi-step mutations exist?

**Backend — selector:**
- Check: is `vote_count` computed via `Count('votes')` annotation — not stored, not Python-computed?
- Check: is feature list ordering `vote_count DESC, created_at DESC, id DESC`?
- Check: is `rate` absent from every `order_by()` call?
- Check: are `select_related` and `prefetch_related` applied?

**Frontend — service:**
- Check: is the Axios instance from `services/api.ts` used — not a local instance, not `fetch`?
- Check: does the service function call the correct endpoint?
- Check: does the service function return the unwrapped payload (post-interceptor `data` field)?

**Frontend — state:**
- Check: is server state being copied into `useState`?
- Check: is a mutation using invalidate-and-refetch (non-vote/unvote) or the optimistic pattern (vote/unvote)?
- Check: does the optimistic update include the rollback on error?

**Frontend — component:**
- Check: is there a direct `axios` or `fetch` call in the component?
- Check: is `vote_count` being computed locally (not from API response)?
- Check: is `has_voted` being derived from click history?
- Check: is `Array.sort()` applied to the feature list?
- Check: are loading, error, and empty states all handled?

State the root cause:
```
Root cause: <single precise sentence — what code is doing wrong and why>
Location: <file path, function name>
```

If the code at the suspected location does not match the failure, return to Step 3 and refine the delta.

---

## Step 5 — Write the regression test before fixing

Before writing the fix, write a test that:
- Reproduces the bug as it currently exists (the test fails on the current code)
- Will pass once the fix is applied

```
Regression test name: test_<actor>_<action>_<expected_outcome>
Test layer: <model / service / selector / API / component>
What it asserts: <precise assertion>
```

Write the test. Confirm it fails on the current code. Do not proceed to Step 6 until the regression test is written.

This is not optional. A fix without a regression test will allow the bug to recur.

---

## Step 6 — Propose and apply the smallest correct fix

State the fix in two parts:

**Change required:**
```
File: <path>
Function: <name>
Change: <what to remove or add>
Justification: <which document defines the correct behavior>
```

**Scope boundary — do not change:**
- Any file not causally connected to the root cause
- Surrounding code that works correctly
- Error handling for scenarios that cannot occur given the documented constraints
- Related but unrelated behavior discovered during investigation (record separately)

Apply the fix. The change must be exactly as scoped above — no more.

---

## Step 7 — Verify the fix

After applying the fix:
- [ ] The regression test from Step 5 now passes
- [ ] All existing tests still pass — no regressions introduced
- [ ] The fix does not introduce a layer boundary violation
- [ ] The fix does not change the API contract without updating the frontend
- [ ] The fix does not leave one layer fixed and the other still broken

If any check fails: investigate before declaring the fix complete.

---

## Step 8 — Record any secondary issues discovered

If the investigation revealed other bugs or structural issues that are outside this fix's scope:

```
Secondary issues found (not fixed here):
- <description>: <file, function — to be addressed separately>
```

Do not fix secondary issues inline. Record them and address them in separate tasks.

---

## Expected Output

- Layer identified (Step 1)
- Expected behavior from documentation (Step 2)
- Precise comparison: expected vs actual (Step 3)
- Root cause: one sentence, with file and function (Step 4)
- Regression test written and failing before fix (Step 5)
- Smallest correct fix applied (Step 6)
- All verification checks passed (Step 7)
- Secondary issues recorded (Step 8)

---

## Failure Conditions

Stop immediately if:
- Expected behavior cannot be determined from documentation — write `DOC GAP:` and stop
- The fix requires changing the API contract — write `CROSS-LAYER CHANGE:` and use `audit-api-contract` + `implement-full-stack-feature`
- The root cause is a missing database migration or schema change — surface full impact before applying
- The bug reveals a systemic pattern (multiple locations with the same flaw) — record as a separate issue; fix only the current instance here

---

## Anti-Patterns — Forbidden

- Guessing the root cause without reading the relevant document
- Fixing symptoms without identifying the root cause
- Writing the fix before writing the regression test
- Applying a fix that changes code beyond the identified failure point
- Refactoring surrounding code as part of a bug fix
- Adding defensive error handling for scenarios that cannot occur given documented constraints
- Asserting `409 Conflict` for duplicate votes in the regression test — the correct behavior is `200 OK`
- Treating `rate` as a ranking factor in any test setup or assertion
- Fixing a cross-layer contract mismatch by changing only one layer

---

## References

- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/domain/voting-rules.md`
- `docs/architecture/backend-architecture.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/rules/backend-rules.md`
- `.claude/rules/frontend-rules.md`
- `.claude/skills/audit-api-contract/SKILL.md`
