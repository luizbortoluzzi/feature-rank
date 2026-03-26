# API Consumption

This document defines how the frontend consumes the backend API. It is the authoritative specification for API interaction patterns, response handling, error handling, and data mapping in the React application.

All frontend code that touches the API must conform to the rules here. This document is aligned with:
- `docs/engineering/backend/api-conventions.md` — the API contract the frontend must consume
- `docs/architecture/frontend-architecture.md` — structural rules for where API code lives
- `docs/domain/feature-voting.md` — domain rules that must not be reimplemented in the frontend

---

## 1. Core Principles

### Backend is the single source of truth

All domain state — feature rankings, vote counts, vote status, lifecycle states — is owned by the backend. The frontend renders what the API returns. It does not maintain a parallel model of this data.

### Frontend must not reimplement backend logic

If the backend enforces a rule (one vote per user, ranking by `vote_count`, admin-only status changes), the frontend does not duplicate it. The frontend calls the API and renders the response. Duplication creates two implementations that will diverge.

### API contract must be respected exactly

The frontend consumes the API as documented in `api-conventions.md`. It does not assume fields that are not in the contract, does not rename fields arbitrarily, and does not invent behavior for edge cases the API already handles.

### No assumptions beyond the API response

The frontend does not infer vote state from button clicks, does not derive `vote_count` by counting, and does not decide whether a user is permitted to do something — it renders based on what the API returned and responds to what the API communicates.

### Consistency over convenience

Every part of the frontend that interacts with the API uses the same patterns — the same client, the same response unwrapping, the same error normalization. Shortcuts that bypass the established pattern are prohibited even when they seem simpler.

### Prohibited behaviors

- Ad hoc API calls scattered inside components, hooks, or utilities outside `services/`
- Client-side reimplementation of vote uniqueness, ranking, status transitions, or any other backend-owned rule
- Silent error handling — swallowed errors, empty catch blocks, console-only logging

---

## 2. API Layer Structure

### Location

All HTTP calls are made in `services/`. This is the only directory where the Axios instance is called. No other layer in the application makes HTTP requests.

### Module layout

One service file per domain resource:

```
services/
├── api.ts           # Axios instance and interceptors
├── features.ts      # Feature request CRUD
├── voting.ts        # Vote and unvote
├── categories.ts    # Category listing
├── statuses.ts      # Status listing
└── auth.ts          # Authentication
```

### Service function naming

Service functions are named after the action and resource. They are named exports, never anonymous functions or default exports.

```ts
// services/features.ts
export async function getFeatureList(params: FeatureListParams): Promise<PaginatedResult<FeatureRequest>>
export async function getFeatureById(id: number): Promise<FeatureRequest>
export async function createFeature(payload: CreateFeaturePayload): Promise<FeatureRequest>
export async function updateFeature(id: number, payload: UpdateFeaturePayload): Promise<FeatureRequest>
export async function deleteFeature(id: number): Promise<void>

// services/voting.ts
export async function voteFeature(featureId: number): Promise<VoteResponse>
export async function unvoteFeature(featureId: number): Promise<VoteResponse>
```

### What service functions do

Each service function:
- Accepts typed input parameters
- Calls the Axios instance from `services/api.ts`
- Returns typed, unwrapped response data (not the raw Axios response or the API envelope)
- Does not contain React, state, hooks, or UI logic

### What service functions do not do

- They do not catch errors. Error normalization is handled by the Axios interceptor (Section 3). Service functions let errors propagate.
- They do not apply business logic. A service function that decides whether to call vote or unvote based on `has_voted` is mixing concerns — that decision belongs in a hook or component.
- They do not format, transform, or rename API fields beyond unwrapping the response envelope.

### Prohibited patterns

- Inline API calls in components: `axios.get('/api/features/')` inside a component is prohibited
- Anonymous service functions: every exported function has a name
- Duplicated endpoint logic: if two places need the same API call, they both call the same service function

---

## 3. API Client Standard

### Single instance

There is exactly one Axios instance in the codebase, defined in `services/api.ts`. All service functions import and use this instance. No file creates its own Axios instance or calls `axios.create()` outside `api.ts`.

### Base URL

The base URL is set once on the Axios instance. No service function constructs a full URL or prefixes `/api/` manually. URL paths in service functions are relative to the configured base.

```ts
// services/api.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### Authentication headers

Authentication credentials (session cookie or Bearer token, depending on implementation) are attached to requests by the Axios request interceptor, not by individual service functions or components. Components never set auth headers.

### Request interceptor responsibilities

- Attach authentication credentials to every outgoing request
- Inject any other required global headers

### Response interceptor responsibilities

- Unwrap the API success envelope: extract `data` and `meta` from the response body
- Normalize API error responses into a consistent `ApiError` shape and throw them
- Handle `401` responses by redirecting to the login page or triggering an auth refresh

### ApiError shape

The interceptor converts all non-2xx responses into a thrown `ApiError`:

```ts
interface ApiError {
  code: string      // machine-readable, e.g. "validation_error", "not_found"
  message: string   // human-readable
  details: Record<string, string[]> | null  // field-level errors, null for non-validation errors
  status: number    // HTTP status code
}
```

After normalization, service functions and hooks work with `ApiError` — never with raw Axios error objects or raw HTTP response bodies.

---

## 4. Response Handling

### Envelope

Every API success response has the shape:

```json
{ "data": <object | array>, "meta": <object | null> }
```

The response interceptor unwraps this envelope before the response reaches service functions. Service functions receive the payload directly.

### List responses

For paginated list endpoints, the interceptor returns both `data` and `meta` as a structured object:

```ts
interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}
```

### Detail responses

For single-object endpoints, the interceptor returns the object directly. `meta` is `null` for all non-list responses and is discarded.

### Vote and unvote responses

Vote and unvote return `200 OK` in all cases. The response body is:

```ts
interface VoteResponse {
  feature_request_id: number
  has_voted: boolean
  vote_count: number
}
```

This response is the authoritative post-action state. `has_voted` and `vote_count` in the UI are updated from this response — not from locally computed values.

### Rules

- No component accesses `.data.data` or `.data.meta` on an Axios response — the interceptor handles unwrapping
- No service function parses the envelope — the interceptor does it once
- No component assumes a response shape that is not documented in `api-conventions.md`

---

## 5. Error Handling Strategy

### Interceptor-level handling

The Axios response interceptor is the first and primary error handler. It:
- Converts all non-2xx responses to `ApiError` objects and throws them
- Redirects to `/login` on `401` responses
- Does not swallow errors for any other status code

### Hook-level handling

TanStack Query captures thrown errors from service functions and exposes them via `isError` and `error` fields on the query or mutation result. Hooks type the error as `ApiError | null`.

### Component-level handling

Components render appropriate UI based on the error state:

| HTTP status | UI response                                                                           |
|-------------|---------------------------------------------------------------------------------------|
| `400`       | Display `error.details` field errors in the form. Show `error.message` as form-level error if `details` is null. |
| `401`       | Already handled by interceptor (redirect). Component renders nothing for this case.  |
| `403`       | Show a permission-denied message. Do not log the user out.                            |
| `404`       | Show a not-found state for the relevant section or page.                              |
| `500`       | Show a generic error message. Do not render raw backend error strings.               |

### Validation errors (`400`)

`error.details` contains field-level messages keyed by field name, matching the form field names exactly:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request body is invalid.",
    "details": {
      "title": ["This field is required."],
      "rate": ["Must be an integer between 1 and 5."]
    }
  }
}
```

The form maps each key in `details` to the corresponding form field and displays the message using React Hook Form's `setError`. This is the only way backend validation errors are surfaced — never as a toast, modal, or generic paragraph.

### Network errors

Network failures (no response received) are caught at the hook level and render a user-visible error state. They are not swallowed. The user must see that the action failed.

### Prohibited error handling patterns

- Empty catch blocks: `catch (e) {}` is prohibited
- Console-only error handling: `catch (e) { console.error(e) }` with no UI response is prohibited
- Swallowing 403 without visible feedback to the user
- Rendering raw API error strings verbatim in the UI

---

## 6. Data Mapping Rules

### General rule

API response data is used as-is. Fields are not renamed, restructured, or recomputed in transit between the service function and the component. Transformation that exists only to satisfy a component's naming preference is prohibited.

### Field-level rules

| Field         | Type      | How it must be used                                                                              |
|---------------|-----------|--------------------------------------------------------------------------------------------------|
| `vote_count`  | `number`  | Rendered as returned. Not incremented, decremented, or recalculated locally.                    |
| `has_voted`   | `boolean` | Drives vote button active state. Set from API response and from vote/unvote mutation response. Not derived from interaction history. |
| `status`      | `object`  | `{ id, name, color, is_terminal }`. Use `name` for display, `color` for styling, `is_terminal` for terminal-state UI logic. Do not hard-code status names in conditional logic. |
| `category`    | `object`  | `{ id, name, icon, color }`. Use `name` for display, `icon` and `color` for visual rendering. Do not hard-code category names in conditional logic. |
| `author`      | `object`  | `{ id, name }` only. Email and other user fields are absent. Do not attempt to access unlisted fields. |
| `rate`        | `number`  | Displayed as-is. Not used in any sort, filter, ranking, or ordering expression.                 |

### No frontend-owned ranking

The feature list is ordered by the API response. The frontend does not apply `Array.sort()` to the feature list for display purposes. The ordering received from `GET /api/features/` is the rank order.

### No field aliasing at the type boundary

TypeScript types in `types/` use `snake_case` field names matching the API response exactly. `vote_count` is not aliased to `voteCount`. `has_voted` is not aliased to `hasVoted`. Aliasing at the type boundary creates a translation layer that diverges over time.

### Permitted transformations

The following are the only transformations that may be applied to API data:

- Formatting `created_at` and `updated_at` ISO strings for display (e.g., `"Jan 10, 2026"`)
- Truncating `title` or `description` for display in list items
- Deriving display-only computed values such as `"42 votes"` from `vote_count`

These transformations happen in utility functions or directly in the render expression. They must not mutate the original API data or be stored back into query cache.

---

## 7. Idempotent Actions

### Vote and unvote are idempotent

The API returns `200 OK` for both vote and unvote regardless of whether the action changed state. A repeated vote on an already-voted feature returns the same `VoteResponse` as the first vote. A repeated unvote on a feature with no vote returns the same `VoteResponse` as a successful unvote.

### Frontend behavior

- The frontend does not track "pending" vote state across repeated calls to determine whether to call vote or unvote. It calls the API and reflects the response.
- A vote button that is clicked while a mutation is already in flight is disabled. The mutation is not re-triggered until the in-flight request resolves.
- After the mutation resolves, `has_voted` and `vote_count` are read from the `VoteResponse` and applied to the cache. The UI reflects this, not any intermediate assumption.
- If the mutation fails, the UI reverts to the pre-action state (see Section 9).

### Repeated actions must not break UI

- Two rapid clicks on the vote button must not produce two concurrent vote requests. The button is disabled while the mutation is in flight.
- If the user votes, the response arrives, the button updates, and the user votes again — this second vote is sent, the API handles it idempotently, and the response updates the UI again. No special case handling is required.

---

## 8. Loading State Handling

### Every async call exposes a loading state

TanStack Query exposes `isLoading` (initial load, no cached data) and `isFetching` (any in-flight request, including background refetches). Service functions do not block — loading state is tracked by TanStack Query.

### When to show a loading indicator

| Context                   | Behavior                                                                 |
|---------------------------|--------------------------------------------------------------------------|
| Initial page load         | Show a `Spinner` or skeleton in place of the content area               |
| Paginating to a new page  | Show a loading indicator while the new page loads; preserve existing content |
| Submitting a form         | Disable the submit button and show a loading label                      |
| Vote / unvote in progress | Disable the vote button while the mutation is in flight                 |
| Background refetch        | Do not show a loading indicator; the existing content remains visible    |

### Loading must not block unrelated UI

A loading state in one section of the page must not freeze or blank unrelated sections. Independent data fetches are independent — their loading states are independent.

### Loading state is not managed in component state

`useState(false)` for tracking a loading condition that TanStack Query already tracks is prohibited. Loading state comes from TanStack Query, not from manually set booleans.

---

## 9. Optimistic vs Pessimistic Updates

### Strategy: pessimistic by default with one explicit optimistic exception

The default update strategy is **pessimistic**: the UI updates only after the API responds with success. The user sees the action in progress (button disabled, spinner visible) and the UI changes only when the server confirms the change.

This is the strategy for all mutations except one.

### Explicit optimistic update: vote and unvote

Vote and unvote are the only mutations permitted to use optimistic updates. This exception exists because the API is explicitly idempotent for these actions and always returns the definitive current state in the response body.

**Optimistic update procedure for vote/unvote:**

1. Before the request is sent, the feature's cached entry is updated with the assumed new `has_voted` and `vote_count` values.
2. The request is sent.
3. If the request succeeds, the cache is updated with the actual `has_voted` and `vote_count` from the `VoteResponse` — overwriting the optimistic assumption with the server's authoritative values.
4. If the request fails, the cache entry is rolled back to the snapshot taken in step 1.

The optimistic values (`has_voted: !current.has_voted`, `vote_count: current.vote_count ± 1`) are estimates. They are replaced by server values on success. They never persist in the cache as facts.

### All other mutations: pessimistic

For create, update, delete, status change, and all other mutations:
- The UI shows a loading state while the request is in flight
- The UI does not change until the API responds
- On success, the relevant query keys are invalidated and refetched
- On failure, the form or UI shows the error; no state has changed

---

## 10. Caching Strategy

### Server state is cached by TanStack Query

TanStack Query manages all server state caching. There is no separate caching layer, no manual `localStorage` cache, and no module-level variables storing API responses.

### Query keys

Query keys are defined as constants in a `query-keys.ts` file within the relevant feature directory. They are never inline strings or arrays inside hook calls.

```ts
// features/feature-requests/query-keys.ts
export const featureKeys = {
  all: ['features'] as const,
  list: (params: FeatureListParams) => ['features', 'list', params] as const,
  detail: (id: number) => ['features', 'detail', id] as const,
}
```

Query keys are the mechanism for targeted cache invalidation. After a mutation, the relevant key is invalidated to trigger a background refetch.

### Cache invalidation rules

| Mutation                  | Keys to invalidate                                               |
|---------------------------|------------------------------------------------------------------|
| Create feature            | `featureKeys.list(...)` (all list variants)                     |
| Update feature            | `featureKeys.detail(id)`, `featureKeys.list(...)`               |
| Delete feature            | `featureKeys.list(...)`, `featureKeys.detail(id)` (removed)     |
| Vote / unvote             | Cache is updated directly from `VoteResponse` (optimistic path); no full refetch unless optimistic update fails |
| Status change             | `featureKeys.detail(id)`, `featureKeys.list(...)`               |

### No ad hoc caching

No component stores API responses in `useState` or `useRef` as a manual cache. No service function caches its own results. Caching is TanStack Query's responsibility, not the component's.

### Reference data (categories, statuses)

Categories and statuses are fetched once on mount and cached with a long `staleTime`. They are not re-fetched on every route change. They are invalidated only when an admin mutation changes them.

---

## 11. Authentication Handling

### Auth credentials are attached by the Axios interceptor

The Axios request interceptor (in `services/api.ts`) is the only place where authentication credentials are attached to requests. No component, hook, or service function reads the auth token and sets a header manually.

### Auth state storage

The authenticated user's data (returned by `GET /api/users/me/`) is stored in `AuthContext`. The raw token or session cookie is managed by the browser (HTTP-only cookie) or by the auth service implementation. No component accesses a stored token directly.

### Unauthenticated responses

When the Axios response interceptor receives a `401`, it:
1. Clears any client-held auth state
2. Redirects to `/login`

This happens exactly once, in the interceptor. No component handles `401` responses individually.

### Protected routes

Route guards are wrapper components that check `AuthContext`. If the current user is absent (not authenticated), they redirect to `/login` before the page component renders. Protected pages do not render and then redirect.

### Admin-gated UI

Admin-only UI elements (e.g., a status change control) are conditionally rendered based on the role field on the current user from `AuthContext`. This is a UI convenience — the backend enforces the permission regardless. A non-admin user seeing a hidden UI element is not a security concern because any request they send will be rejected with `403`.

---

## 12. Anti-Patterns

These patterns are prohibited in all frontend code that interacts with the API.

| Anti-pattern                                                   | Why it is prohibited                                                    |
|----------------------------------------------------------------|-------------------------------------------------------------------------|
| `axios.get(...)` or `fetch(...)` inside a component or hook    | All HTTP calls belong in `services/`. No exceptions.                   |
| Duplicated endpoint logic in two service files or hooks        | One service function per endpoint. Called from many places if needed.  |
| Accessing `.data.data` on an Axios response in a component     | The interceptor unwraps the envelope. Components receive typed data.   |
| `catch (e) {}` or `catch (e) { console.error(e) }`             | Errors must surface to users. Silent failures are prohibited.          |
| Computing `vote_count` by incrementing/decrementing locally    | `vote_count` comes from the API or `VoteResponse`. Not from local math.|
| Sorting the feature list in the frontend                       | API response order is the ranking. Frontend sort is prohibited.        |
| Using `rate` in any sort or filter expression                  | `rate` does not affect ranking. This rule has no exceptions.           |
| Renaming `snake_case` API fields to `camelCase` in types       | Types mirror the API contract. No aliasing at the type boundary.       |
| Deriving `has_voted` from interaction history                  | `has_voted` comes from API responses and `VoteResponse` only.          |
| Multiple Axios instances in the codebase                       | One instance in `services/api.ts`. All service functions use it.       |
| Components attaching auth headers manually                     | Auth headers are set by the Axios request interceptor only.            |
| Caching API responses in `useState` or `useRef`                | Caching is TanStack Query's responsibility.                            |
| Inline query keys as strings inside `useQuery` calls           | Query keys are constants defined in `query-keys.ts` files.             |
| Sending `author_id` in create or update request bodies         | `author_id` is backend-derived. It must not be submitted by the client.|
| Sending `status_id` in request bodies from non-admin flows     | Status changes are admin-only. Non-admin forms must not include this field. |
| Tightly coupling a component to a specific API endpoint shape  | Components consume typed domain objects from hooks, not raw API shapes.|
