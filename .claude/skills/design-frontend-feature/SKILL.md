---
name: design-frontend-feature
description: Produce a complete, architecture-aligned frontend implementation plan before writing any UI code. Run this before implement-frontend-feature for any non-trivial page, feature, or flow.
---

# Skill: design-frontend-feature

## Purpose

Produce a complete, architecture-aligned frontend implementation plan before writing any code. This skill is a gate. No frontend code is written until this skill is complete.

---

## When to Use

- Before implementing any non-trivial frontend feature, page, or flow
- Before adding new stateful UI, forms, or data-fetching logic
- Before consuming a new or changed backend API endpoint in the UI

This skill is a prerequisite for `implement-frontend-feature` and `connect-to-api` when the scope is non-trivial.

If this feature requires backend changes, stop. Defer to `architect` for contract definition before proceeding.

---

## Required Inputs

Before starting, confirm you have:
- A precise description of the user-facing behavior being added or changed
- Clarity on which backend endpoint(s) will be consumed (method, URL)
- Confirmation that no backend changes are required, or that the contract is already defined

---

## Step 0 — Run map-repo

Execute the `map-repo` skill before any other step.

From the `map-repo` output, extract and record:
- Every file in `frontend/` that is affected or likely affected
- Which backend endpoints the affected UI consumes
- Whether any API contract is changing
- Whether a new page, feature folder, or shared component is required

Do not proceed to Step 1 until `map-repo` is complete.

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/architecture/frontend-architecture.md` — folder structure, component layer responsibilities, technology constraints, what belongs where. This is the structural authority.
2. `docs/engineering/frontend/react-standards.md` — naming conventions, file organization, component rules, hook rules, TypeScript standards.
3. `docs/engineering/frontend/api-consumption.md` — service layer rules, Axios instance, query key conventions, response handling, optimistic update procedure, forbidden patterns.
4. `docs/engineering/frontend/state-management.md` — state tiers and ownership rules: TanStack Query for server state, `useState` for UI state, `AuthContext` for current user only. What must not be duplicated.
5. `docs/engineering/frontend/ui-ux-guidelines.md` — UX completeness requirements: loading, error, and empty states are mandatory for every async operation.
6. `docs/engineering/backend/api-conventions.md` — exact response envelope, field names (`snake_case`), error format, pagination structure. The frontend consumes this exactly as documented.

**Read if applicable:**
- `docs/domain/feature-voting.md` — required if the feature involves feature requests, voting, status, or user roles.
- `docs/domain/voting-rules.md` — required if the feature renders or interacts with `vote_count`, `has_voted`, or ranking.

Do not proceed past Step 0 without completing this reading.

---

## Step 1 — Identify affected pages, features, and components

State explicitly:

```
Affected areas:
- Pages (pages/): <route name, file path>
- Features (features/<name>/): <feature folder, what changes>
- Shared components (components/): <component name, new or modified>
- New items required: <yes/no, what>
```

Verify that every folder and file location matches `docs/architecture/frontend-architecture.md`. Do not invent a folder structure. If a location is unclear, resolve it from the doc before continuing.

If this feature requires a backend change or a new API endpoint that does not yet exist: **stop. Write "DEFER TO ARCHITECT:" and stop.**

### Step 2 — Identify required API calls

For every piece of data the feature displays or mutates, name the API call:

```
API calls required:
- <GET/POST/PUT/PATCH/DELETE> <URL>
  Purpose: <what data this retrieves or what action this performs>
  Response fields consumed: <list — from docs/engineering/backend/api-conventions.md>
  Service function: <existing function name, or "new — services/<resource>.ts">
  Query key: <existing constant name, or "new — define in <file>">
```

Confirm every field in "Response fields consumed" exists in the documented API response. Do not list fields that are not in the contract.

If a required field is absent from the contract: **stop. Write "API CONTRACT GAP:" and surface to `architect`.**

### Step 3 — Assign state to the correct tier

For every piece of state the feature needs, assign it to exactly one tier:

```
State assignments:
- <data name>: <tier> — <mechanism>
```

| State type | Correct tier | Mechanism |
|---|---|---|
| Feature list, feature detail, vote state, categories | Server state | TanStack Query `useQuery` |
| Vote, unvote, create, update mutations | Server mutation | TanStack Query `useMutation` |
| Modal open/close, tab selection, controlled form input | Local UI state | `useState` |
| Current authenticated user | Shared app state | `AuthContext` — read-only via `useCurrentUser()` |

**Rules that must not be violated:**
- Server state is never copied into `useState`, `useRef`, or Context
- `AuthContext` is the only Context that holds API-derived data
- After any mutation except vote/unvote: invalidate query key and refetch — do not manually update cache
- Vote/unvote: use the optimistic update pattern defined in `docs/engineering/frontend/api-consumption.md` — snapshot → apply estimate → send → overwrite with `VoteResponse` on success → roll back on failure

### Step 4 — Define loading, error, and empty states for every async operation

For every API call identified in Step 2, define all three states:

```
Async operation: <service function name>
  Loading: <component — Spinner / skeleton, no layout shift>
  Error:
    401: redirect to /login
    403: <permission-denied message>
    404: <not-found state>
    400: field-level errors in form via error.details
    500: generic error message — no raw error strings
  Empty: <EmptyState component with message — never blank space>
```

No async operation may have an undefined state for any of these three cases. A component that handles only the success case is incomplete.

### Step 5 — Classify components as reusable or feature-local

For every component needed:

```
Components:
- <ComponentName>: reusable / feature-local
  Location: components/<component-name>/index.tsx
          OR features/<feature-name>/components/<component-name>/index.tsx
  Reason: <why reusable or why feature-local>
```

Decision rule:
- **Reusable**: used across two or more features → `components/<name>/`
- **Feature-local**: used only within one feature → `features/<name>/components/<name>/`
- When uncertain, default to feature-local. Promote to `components/` only when a second consumer exists.

Do not place feature-specific components in `components/`. Do not place reusable components in a feature folder.

### Step 6 — Define the complete folder and file structure

Write the exact paths for every new file:

```
Files to create:
- frontend/src/<exact/path/file.ts>: <purpose>
- frontend/src/<exact/path/index.tsx>: <component name>
- ...

Files to modify:
- frontend/src/<exact/path/file.ts>: <description of change>
```

Naming rules (from `docs/engineering/frontend/react-standards.md`):
- Folders: `kebab-case`
- Components: `PascalCase` exported from `index.tsx`
- Hooks: `camelCase`, prefix `use`, in `features/<name>/hooks/` or `hooks/`
- Service files: one per resource (`features.ts`, `voting.ts`, `categories.ts`)
- Query key files: one per feature area, define constants — never inline strings

### Step 7 — Identify UX risks and edge cases

State every edge case and what the correct behavior is:

```
UX risks:
- Vote while already voted: button reflects has_voted from API; mutation disabled while isPending
- Double-submit: action button disabled while mutation isPending
- Unauthenticated access to protected page: redirect to /login before rendering
- Form submitted with validation errors: field-level error from error.details rendered under each field
- Page accessed with invalid ID: not-found state rendered
- <any additional edge case>: <correct behavior>
```

Do not leave any edge case with "TBD" or "handled automatically."

### Step 8 — Produce the implementation plan

Output the following block. Do not proceed to implementation until this block is complete.

```
FRONTEND DESIGN PLAN
====================
Feature: <description>
Backend endpoints consumed: <from Step 2>
API contract changes required: none / DEFER TO ARCHITECT

Files to create: <from Step 6>
Files to modify: <from Step 6>

State assignments: <from Step 3>
Optimistic update: yes/no — vote/unvote only

Async state coverage:
  <operation>: loading=<component>, error=<handling>, empty=<component>

Component classification: <from Step 5>

UX risks addressed: <from Step 7>

Blocking issues: <list, or "none">
```

If there are blocking issues, stop. Resolve them before writing code.

---

## Expected Output

A complete `FRONTEND DESIGN PLAN` block as defined in Step 8.

---

## Failure Conditions

Stop immediately if:
- A required API field is not in the documented backend contract — write `API CONTRACT GAP:` and surface to `architect`
- The feature requires computing `vote_count` or `has_voted` locally — write `FORBIDDEN:` and surface the conflict
- The feature requires sorting or reordering the feature list on the client — write `FORBIDDEN:`
- The feature requires a backend change — write `DEFER TO ARCHITECT:`
- A required document is absent or ambiguous — write `DOC GAP:` and stop; do not invent behavior

---

## Anti-Patterns — Forbidden

- Writing any code before the `FRONTEND DESIGN PLAN` is complete
- Listing API fields that do not exist in the contract
- Assigning server state to `useState` or Context
- Planning any `Array.sort()` on the feature list
- Planning to compute `vote_count` or `has_voted` locally
- Planning to send `author_id` or `status_id` from non-admin forms
- Leaving any async operation with an undefined loading, error, or empty state
- Using Context for data that changes with user interactions

---

## References

- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `.claude/rules/frontend-rules.md`
- `.claude/agents/frontend-engineer.md`
- `.claude/skills/map-repo/SKILL.md`
