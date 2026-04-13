---
name: audit-api-contract
description: Audit alignment between the documented API contract, backend implementation, and frontend consumption. Detect drift, mismatches, and undocumented behavior. Produce a concrete findings report.
---

# Skill: audit-api-contract

## Purpose

Detect contract drift between the documented API contract, the backend implementation, and the frontend consumption. Produce a concrete, actionable findings report. Every finding states the location, the expected behavior (from the document), the actual behavior (from the code), and the required fix.

---

## When to Use

- After any API change (endpoint added, modified, or removed)
- When frontend behavior seems inconsistent with what the backend returns
- Before finalizing a full-stack feature
- When `review-change` identifies possible contract drift

---

## Required Inputs

- The specific endpoint(s) or feature area to audit (be concrete: URL, feature name, or domain)

---

## Required Documents — Establish Ground Truth First

Read these documents before inspecting any code. The documents define what is correct. The code is measured against them.

**Always read:**
1. `docs/engineering/backend/api-conventions.md` — the authoritative API contract standard. Response envelope, error format, HTTP status codes, field naming (`snake_case`), pagination structure, prohibited shapes. Read completely. This is the ground truth.
2. `docs/engineering/frontend/api-consumption.md` — how the frontend must consume the API. Service layer, Axios instance, query keys, response handling, what the frontend is and is not permitted to do with API data.
3. `docs/domain/voting-rules.md` — required for any audit involving votes, `vote_count`, `has_voted`, `rate`, or ranking. Defines idempotency behavior and field semantics.
4. `docs/domain/feature-voting.md` — domain rules for feature requests, statuses, user roles.

**Read if applicable:**
- `docs/architecture/backend-architecture.md` — if the audit covers layer boundary violations.
- `docs/architecture/frontend-architecture.md` — if the audit covers frontend structural issues.

Do not inspect code before completing this reading. The document defines correctness; the code does not.

---

## Execution Steps

Execute every step in order. Steps 1–3 establish ground truth. Steps 4–7 inspect the code. Step 8 produces findings.

### Step 1 — Extract the documented contract

From `docs/engineering/backend/api-conventions.md`, write the expected contract for every endpoint being audited:

```
Endpoint: <METHOD> <URL>
Authentication: required / not required
Request body:
  Accepted fields: <list>
  Forbidden from client: author_id, vote_count, status_id (non-admin)
Success response:
  HTTP: <status code>
  Envelope: { "data": <shape>, "meta": <pagination or null> }
Error responses:
  <scenario>: HTTP <code>, { "error": { "code", "message", "details" } }
Idempotency:
  Duplicate vote (POST /vote/): 200 OK — not 409, not 404
  Missing vote (DELETE /vote/): 200 OK — not 404
  Other: <or "not applicable">
Feature list ordering: vote_count DESC, created_at DESC, id DESC
rate: display only — never a sort parameter
```

This block is the reference against which both backend and frontend are measured.

### Step 2 — Extract the documented frontend consumption rules

From `docs/engineering/frontend/api-consumption.md`, extract rules for consuming this endpoint:

```
Frontend consumption rules:
- vote_count: rendered as-is, never incremented/decremented locally
- has_voted: from API response only, never derived from click history
- feature list order: rendered as returned, no Array.sort()
- rate: displayed as-is, never used in sort/rank/filter
- status: { id, name, color, is_terminal } — all fields required in type
- author: { id, name } — no email
- query key: defined as constant, never inline string
- service calls: through services/api.ts Axios instance only
- optimistic update: vote/unvote only — snapshot, estimate, overwrite from VoteResponse, rollback on error
- other mutations: invalidate-and-refetch only
```

### Step 3 — Identify field-by-field expected shapes

Write the expected shape for every response object involved:

```
FeatureRequest response shape:
  id: number
  title: string
  description: string
  vote_count: number  (annotation-derived, never stored)
  has_voted: boolean  (annotation-derived, filtered to user)
  rate: number        (display only)
  status: { id: number, name: string, color: string, is_terminal: boolean }
  category: { id: number, name: string, icon: string, color: string }
  author: { id: number, name: string }  (no email)
  created_at: string
  updated_at: string

VoteResponse shape:
  feature_request_id: number
  has_voted: boolean
  vote_count: number

PaginationMeta shape:
  count: number
  next: string | null
  previous: string | null
  page_size: number
  current_page: number
```

---

## Step 4 — Inspect the backend implementation

Read backend code in this order for each endpoint: serializer first (output shape), then selector (ordering, annotations), then view (status codes, response wrapping), then service (idempotency logic).

For each item, mark `✓` (correct) or `✗ MISMATCH` (deviation found):

**Response shape:**
- [ ] Response wrapped in `{ "data": ..., "meta": ... }` ✓/✗
- [ ] Error responses use `{ "error": { "code", "message", "details" } }` ✓/✗
- [ ] All field names are `snake_case` ✓/✗
- [ ] `vote_count` is a `Count('votes')` annotation — not a stored field, not Python-computed ✓/✗
- [ ] `has_voted` is an annotation filtered to the authenticated user's ID ✓/✗
- [ ] `status` shape: `{ id, name, color, is_terminal }` ✓/✗
- [ ] `category` shape: `{ id, name, icon, color }` ✓/✗
- [ ] `author` shape: `{ id, name }` — no email field ✓/✗

**Ordering (for feature list):**
- [ ] `order_by('vote_count', 'created_at', 'id')` descending — applied in selector, not view ✓/✗
- [ ] `rate` absent from every `order_by()` call ✓/✗
- [ ] `select_related` and `prefetch_related` applied for all related objects ✓/✗

**Protected fields:**
- [ ] `author_id` not accepted from client in any serializer ✓/✗
- [ ] `vote_count` not accepted from client in any serializer ✓/✗
- [ ] `status_id` not accepted from non-admin clients ✓/✗

**Idempotency:**
- [ ] Duplicate vote → service catches `IntegrityError` → returns `200 OK` with current state ✓/✗
- [ ] Missing vote on unvote → service returns `200 OK` with current state ✓/✗
- [ ] Neither returns `409 Conflict` or `404` ✓/✗
- [ ] Unvote returns `200 OK` with body — not `204 No Content` ✓/✗

**HTTP status codes:**
- [ ] Create: `201 Created` ✓/✗
- [ ] Read: `200 OK` ✓/✗
- [ ] Update: `200 OK` ✓/✗
- [ ] Delete: `204 No Content` (non-vote) or `200 OK` (unvote) ✓/✗
- [ ] Auth failure: `401` ✓/✗
- [ ] Permission failure: `403` ✓/✗
- [ ] Not found: `404` ✓/✗
- [ ] Validation failure: `400` with `details` ✓/✗

Record every `✗` as a finding.

### Step 5 — Inspect the frontend service functions

Read `services/<resource>.ts` files for the endpoints being audited:

- [ ] Calls `services/api.ts` Axios instance — not a local Axios instance, not `fetch` ✓/✗
- [ ] Does not catch errors (interceptor handles normalization) ✓/✗
- [ ] Returns the unwrapped payload — the `data` field post-interceptor, not the full envelope ✓/✗
- [ ] TypeScript types use `snake_case` field names matching the API contract ✓/✗
- [ ] `status` type includes `is_terminal: boolean` ✓/✗
- [ ] `author` type does not include `email` ✓/✗

Record every `✗` as a finding.

### Step 6 — Inspect the frontend hooks and components

Read the hooks and components that consume the affected endpoints:

- [ ] No direct `axios` or `fetch` calls in components or hooks ✓/✗
- [ ] Query keys defined as constants — no inline strings ✓/✗
- [ ] Server state lives in TanStack Query — not copied to `useState` or Context ✓/✗
- [ ] `vote_count` rendered as-is — not incremented or decremented locally ✓/✗
- [ ] `has_voted` drives button state from API value — not from click history ✓/✗
- [ ] Feature list rendered in API order — no `Array.sort()` applied ✓/✗
- [ ] `rate` displayed as-is — not used in sort, filter, or ranking expression ✓/✗
- [ ] Vote/unvote use full optimistic update: snapshot → estimate → overwrite from VoteResponse → rollback on error ✓/✗
- [ ] All other mutations use invalidate-and-refetch only ✓/✗
- [ ] Loading state handled for all `useQuery` calls ✓/✗
- [ ] Error state handled — `401` redirects to `/login`, `403` shows permission denied, `404` shows not found ✓/✗
- [ ] Empty state handled — `EmptyState` rendered, not blank space ✓/✗
- [ ] `author_id` and `status_id` absent from non-admin form submission payloads ✓/✗
- [ ] `isPending` disables the action button during mutations ✓/✗

Record every `✗` as a finding.

### Step 7 — Compile findings

For every `✗` found in Steps 4–6, write one finding entry:

```
Finding <N>:
  Severity: Critical / High / Medium
  Location: <file path, function or component name>
  Type: <response-shape / field-name / status-code / idempotency / ordering / state-management / direct-api-call / type-missing-field>
  Expected: <what the document says, with document reference>
  Actual: <what the code does>
  Required fix: <what change is needed and in which file>
  Layer fix required: backend only / frontend only / both layers
```

Severity definitions:
- **Critical**: violates a domain invariant, breaks the API contract, or creates a security gap. Examples: `409` for duplicate vote, `rate` in ordering, `author_id` writable by client, `vote_count` stored on model.
- **High**: incorrect response shape, wrong status code, missing field in type, server state duplicated in `useState`.
- **Medium**: missing `is_terminal` in status type, inline query key string, missing `isPending` button disable.

Do not combine multiple mismatches into one finding. One finding per issue.

### Step 8 — Produce the audit report and doc sync check

```
API CONTRACT AUDIT REPORT
=========================
Endpoint(s) audited: <list>
Documents used as ground truth: <list>

Findings:
<all findings from Step 7, numbered>

Required fixes: <count>
Critical: <count>
High: <count>
Medium: <count>

Documentation sync required:
- docs/engineering/backend/api-conventions.md: yes/no — <what to update>
- docs/domain/voting-rules.md: yes/no — <what to update>
- Other: <file>: yes/no
```

If documentation changes are required, update them now — do not defer doc sync.

---

## Expected Output

A complete `API CONTRACT AUDIT REPORT` block as defined in Step 8.

---

## Failure Conditions

Stop immediately if:
- The documented contract in `docs/engineering/backend/api-conventions.md` is absent or ambiguous for the endpoint being audited — write `DOC GAP:` and surface to `architect`
- A Critical finding is found involving a core domain invariant (vote uniqueness, ranking, protected fields) — surface immediately before continuing the audit
- Backend and frontend use fundamentally different contract assumptions — this requires cross-layer fix coordination; do not fix one layer without the other

---

## Anti-Patterns — Forbidden

- Inspecting code before reading the documents that define correctness
- Accepting `409 Conflict` for duplicate votes as correct — it is always a Critical finding
- Accepting `rate` in any `order_by()` as correct — it is always a Critical finding
- Accepting locally computed `vote_count` or `has_voted` as correct — Critical finding
- Accepting direct `axios` or `fetch` in components as correct — High finding
- Accepting inline query key strings as correct — Medium finding
- Proposing fixes that update only one layer for a cross-layer contract violation
- Marking a finding as acceptable without a justification traceable to a document

---

## References

- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/domain/voting-rules.md`
- `docs/domain/feature-voting.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `.claude/rules/backend-rules.md`
- `.claude/rules/frontend-rules.md`
- `.claude/agents/reviewer.md`
- `.claude/skills/debug-issue/SKILL.md`
