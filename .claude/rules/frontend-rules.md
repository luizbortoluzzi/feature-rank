# Frontend Implementation Rules

## Scope

These rules apply to all code under `frontend/` and all frontend-facing behavior. They govern React + TypeScript implementation, API consumption, state management, component structure, and UX completeness.

They align with and must remain consistent with:
- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/engineering/backend/api-conventions.md`

When code conflicts with any of the above documents, the conflict must be surfaced explicitly. Agents must not silently invent behavior not defined by those docs.

---

## 1. Architecture Compliance

The frontend is an API consumer. It is not a domain authority.

**Mandatory:**
- The frontend renders what the API returns. It does not compute, infer, or derive domain state from local assumptions.
- The backend is the sole source of truth for: vote state, vote counts, ranking order, permissions, status, and author identity.
- Feature list ordering must match the API response order exactly. The frontend does not sort, reorder, or re-rank.
- `has_voted` and `vote_count` come from the API response. They are never computed locally, except in the one explicitly permitted optimistic update case (see Section 4).
- Status change gating is determined by the API returning `403`. The frontend may hide controls based on role data from the API, but the backend is the final authority.
- The data fetching chain must be followed without bypassing any step:
  ```
  Component → Custom hook → Service function → Axios instance → Backend API
  ```

**Forbidden:**
- Reimplementing backend business rules in frontend code.
- Deriving `has_voted` from local interaction history or local state.
- Sorting or reordering the feature list with `Array.sort()` or any client-side mechanism.
- Computing `vote_count` by local increment or decrement (except the permitted optimistic update).
- Deciding whether a user is allowed to do something based on anything other than what the API communicates.

---

## 2. Project Structure and File Discipline

All frontend code must follow the directory structure defined in `docs/architecture/frontend-architecture.md`.

**Directory ownership:**

| Directory | Owns |
|---|---|
| `pages/` | Route-level components. Assemble features into a complete view. No inline data fetching. |
| `components/` | Reusable, presentational, domain-unaware UI components. Receive all data via props. |
| `features/` | Domain-specific groupings. Each feature owns its own components, hooks, and local types. |
| `hooks/` | Shared, non-feature-specific hooks only. Feature-specific hooks live inside `features/`. |
| `services/` | The only place where HTTP requests are made. One file per resource. |
| `types/` | Shared TypeScript types used across multiple features. |
| `utils/` | Pure functions with no React or domain dependencies. |

**Mandatory:**
- Reusable components must live in their own `kebab-case` folder under `components/` or `features/*/components/`.
- Every reusable component folder must export from `index.tsx`.
- Feature-specific hooks live inside `features/<feature-name>/hooks/`, not in the top-level `hooks/` directory.
- Types that belong to a single feature stay in that feature's directory, not in `types/`.
- Service files must correspond to a resource: `features.ts`, `voting.ts`, `categories.ts`, `statuses.ts`, `auth.ts`.

**Forbidden:**
- API calls in `components/`, `utils/`, or anywhere outside `services/`.
- Domain-specific conditional logic in `components/` (e.g., "if status is rejected, do X").
- Feature-specific hooks placed in the top-level `hooks/` directory.
- Mixing unrelated concerns within a single component.
- Components too large to read in one screen — extract sub-components.

---

## 3. API Discipline

All API interaction is exclusively in `services/`. No exceptions.

**Mandatory:**
- All HTTP requests go through the centralized Axios instance defined in `services/api.ts`. No component, hook, or utility instantiates its own Axios instance or calls `fetch` directly.
- Service functions must: accept typed input parameters, call the Axios instance, and return typed response data unwrapped from the API envelope.
- Service functions must not contain UI logic, state, or React concerns.
- The API envelope format is: `{ data: T, meta: PaginationMeta | null }` for success and `{ error: { code, message, details } }` for errors. The Axios interceptor unwraps this.
- Field names from API responses must be consumed exactly as returned (`snake_case`). No aliasing or renaming at the type boundary.
- Query keys must be defined as constants in query key files. They must never be inline strings or arrays defined inside hook calls.

**Mandatory API field consumption:**

| Field | Rule |
|---|---|
| `vote_count` | Displayed as-is. Never computed locally. |
| `has_voted` | Drives vote button state. Source: API only (or mutation response for optimistic update). |
| `status` | Rendered using `name` and `color`. Never used to gate client-side logic beyond UI hints. |
| `category` | Rendered using `name`, `icon`, and `color`. |
| `author` | Only `id` and `name` are available. Email is never present. |
| `rate` | Displayed as-is. Never used in any sort, filter, or ranking logic. |

**Forbidden:**
- Importing and calling Axios or `fetch` directly in components, hooks, or utils.
- Inventing response fields that are not in the API contract.
- Renaming or aliasing API fields at the type boundary.
- Inline query key strings inside hook calls.
- Sending `author_id` in create or edit form submissions from non-admin flows.
- Sending `status_id` in create or edit form submissions from non-admin flows.
- Sending `vote_count` in any request body.

---

## 4. State Discipline

**State tiers and their owners:**

| State type | Where it lives | Examples |
|---|---|---|
| Server state | TanStack Query cache | Feature list, feature detail, categories, current user |
| Local UI state | `useState` / `useReducer` | Modal open, active tab, controlled input |
| Shared UI state | React Context (limited scope) | Current authenticated user, theme |
| Global app state | Not used | — |

**Mandatory:**
- Server state is owned exclusively by TanStack Query. It must never be duplicated into `useState` or Context.
- React Context is used only for stable, low-frequency values: the current authenticated user and theme preference. Not for feature list data, vote state, or any server-derived value.
- The authenticated user is fetched once on app load via `GET /api/users/me/` and stored in a Context provider. The context value is the API response shape — it must not be transformed or extended locally.
- Mutations (create, update, vote, unvote) use `useMutation`. On success, they invalidate the relevant query keys to trigger a refetch.
- The one permitted optimistic update: vote and unvote mutations may use `has_voted` and `vote_count` from the mutation response to update the specific feature's cache entry immediately. No other mutations may use optimistic updates — they must invalidate and refetch.

**Forbidden:**
- Duplicating server state into `useState` or Context.
- Using React Context for feature list data, vote state, or any value that changes with user interactions.
- Manually computing cache updates with assumed (non-API-sourced) values.
- Any global state library (Redux, Zustand, Jotai) without explicit justification and documentation.
- `useReducer` used as a substitute for a proper state management library.

---

## 5. UX Completeness

Every async operation has three states: loading, error, and success/empty. All three must be handled.

**Mandatory:**
- Loading state: render a consistent `Spinner` or skeleton component from `components/`. Must not cause layout shift.
- Error state: all errors surface a visible message to the user. Silent failures are prohibited.
  - `400` validation errors are shown at the field level in forms.
  - `401` responses redirect to the login page.
  - `403` responses display a permission-denied message.
  - `404` responses display a not-found state.
  - `500` responses display a generic error message without raw details.
- Empty state: a list with zero results must render an explicit `EmptyState` component, not blank space.
- Vote state must be visually clear at all times. The vote button must reflect the current `has_voted` value from the API.
- User actions (vote, submit, create) must have visible feedback (loading indicator, success state, or error message).

**Forbidden:**
- Async operations with no loading indicator.
- Silent error handling — catching errors without surfacing them to the user.
- Empty list renders that display blank space instead of an empty state component.
- Raw API error strings displayed verbatim unless they are confirmed to be user-safe.
- A component that makes an async call without handling all three states.

---

## 6. TypeScript Discipline

**Mandatory:**
- TypeScript strict mode is active. All code must comply.
- Every component must have a typed props interface.
- All API-driven structures must be typed. Types must reflect the API contract exactly — field names in `snake_case`, matching the API response.
- Shared types across multiple features live in `types/`. Types used only within one feature stay in that feature's directory.
- `any` is prohibited except in explicitly justified adapter boundaries.

**Forbidden:**
- `any` used for convenience or to bypass TypeScript errors.
- Props interfaces missing from components.
- Duplicate type definitions for the same entity in different parts of the codebase.
- Unsafe casts (`as SomeType`) without justification.
- Types that diverge from the API contract field names or shapes.

---

## 7. Form Discipline

**Mandatory:**
- Forms are built with React Hook Form. Use `register` for uncontrolled inputs and `Controller` for controlled inputs.
- Submit handlers call the service function via a `useMutation` hook. They must not call `fetch` or `axios` directly.
- Backend `400` validation errors (`error.details`) must be mapped to the corresponding form field and displayed under that field.
- Frontend validation exists for UX only: required fields, `rate` range (1–5), and visible string length limits. It does not replace backend enforcement.

**Forbidden:**
- `author_id` as a form field in any flow.
- `status_id` as a form field in non-admin create or edit flows.
- Submit handlers that call HTTP clients directly instead of going through `useMutation`.
- Ignoring `error.details` from `400` responses — they must always be reflected in the form.

---

## 8. Routing Discipline

**Mandatory:**
- Protected routes must be wrapped in a route guard component that checks the current user context and redirects to `/login` before rendering.
- Route params (`:id`) must be read with `useParams` and passed immediately to the relevant hook.
- Navigation after mutations uses `useNavigate`. It must not be triggered inside service functions.

**Forbidden:**
- Pages that render and then redirect — they must redirect before rendering.
- Passing route params as props through multiple component layers instead of reading them with `useParams`.
- Navigation logic inside service functions.

---

## 9. Anti-Patterns — Explicitly Forbidden

- **Direct API calls in components or hooks:** All HTTP interaction is in `services/`. No exceptions.
- **Business logic in UI components:** If a component is making domain decisions (ranking, vote constraints, status transition checks, permission derivation), that logic does not belong there.
- **Duplicating backend rules in frontend:** If the backend enforces a rule, the frontend does not reimplement it. Duplication creates two sources of truth that will diverge.
- **Sorting or reordering API responses:** `Array.sort()` applied to the feature list for display purposes is prohibited.
- **Deriving `has_voted` or `vote_count` locally:** These come from the API. The only permitted local update is the explicit optimistic update using values from the mutation response.
- **Sending `author_id` or `status_id` from non-admin forms:** These fields must not appear in non-admin form submission payloads.
- **Silent failures:** Every async call must have an error handler that surfaces the error to the user.
- **Global state for server data:** Feature list, vote state, and user data live in TanStack Query. They must not be copied into Context or module-level variables.
- **Inline query keys:** Query keys are defined as constants, never as inline strings inside hook calls.
- **Unguarded route access:** Protected routes must redirect before rendering, not after.
- **Hidden data transformation in JSX:** Data mapping and transformation belong in hooks or service functions, not inline inside JSX.
- **Inconsistent folder structure:** New files must follow the established directory conventions. Deviation requires explicit justification.
