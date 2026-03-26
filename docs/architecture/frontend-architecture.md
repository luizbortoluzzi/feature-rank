# Frontend Architecture

This document is the authoritative specification for how the React frontend is structured and how responsibilities are distributed across the application. It defines what code belongs where, how the application interacts with the backend, and which patterns are prohibited.

All frontend code in `frontend/` must conform to the rules defined here. This is not a style guide. It is a set of enforced architectural constraints.

---

## 1. Architectural Principles

The frontend is a **client** of the backend API. It is not an independent system with its own notion of truth.

### Core positions

- The backend is the sole source of truth for all domain state.
- The frontend renders what the API returns. It does not compute, infer, or derive domain state from local assumptions.
- The frontend does not reimplement backend business rules. If a rule exists in the backend (vote uniqueness, ranking logic, status permissions), it must not be duplicated in the frontend.
- The frontend does not decide whether a user is allowed to do something — it renders UI based on what the API communicates and responds to what the API returns.

### What this means in practice

- Vote uniqueness is enforced by the backend. The frontend sends the request and reflects the response. It does not track whether the user "should" be allowed to vote.
- Ranking is determined by the API response order. The frontend does not sort or reorder the feature list.
- Status changes are gated by the backend returning 403. The frontend may hide controls for non-admin users based on role data from the API, but the backend is the final authority.
- `has_voted` and `vote_count` come from the API. The frontend does not compute them.

---

## 2. Technology Stack

The following technologies are in use. There are no alternatives.

| Concern        | Technology                        |
|----------------|-----------------------------------|
| UI framework   | React 18+                         |
| Language       | TypeScript (strict mode)          |
| Build tool     | Vite                              |
| Routing        | React Router v6                   |
| Data fetching  | TanStack Query (React Query) v5   |
| HTTP client    | Axios (centralized, single instance) |
| Form handling  | React Hook Form                   |

### Constraints

- TypeScript strict mode is active. `any` is prohibited except in explicitly justified adapter boundaries.
- All API interaction goes through the centralized Axios instance. No component or hook calls `fetch` or instantiates its own Axios instance.
- TanStack Query manages all server state. Local React state manages only UI-local concerns (open/closed modal, active tab, controlled input values).

---

## 3. Project Structure

```
frontend/src/
├── pages/
├── components/
├── features/
├── hooks/
├── services/
├── types/
└── utils/
```

### `pages/`

Route-level components. Each file corresponds to a route. Pages assemble features and components into a complete view. They are responsible for:
- rendering the top-level layout for a route
- passing route params to features or hooks that need them
- handling page-level loading and error states when no feature owns them

Pages must not contain inline data fetching logic. They delegate to hooks and features.

### `components/`

Reusable, presentational UI components with no domain awareness. A component in this directory:
- receives all data via props
- does not call the API
- does not read from TanStack Query cache directly
- does not contain domain-specific conditional logic (e.g., "if status is rejected, do X")

Examples: `Button`, `Badge`, `Modal`, `Spinner`, `Pagination`, `EmptyState`, `ErrorMessage`.

### `features/`

Domain-specific UI groupings. Each feature corresponds to a domain concept: `feature-requests`, `voting`, `categories`, `statuses`, `auth`. A feature directory owns:
- its own components (not shared across features)
- its own hooks that call into `services/`
- its own local types if they do not belong in `types/`

Feature components may be data-aware. They use hooks to fetch data and pass it to presentational components. A feature is the boundary between "raw UI" and "domain behavior."

```
features/
├── feature-requests/
│   ├── components/
│   ├── hooks/
│   └── index.ts
├── voting/
│   ├── components/
│   ├── hooks/
│   └── index.ts
└── ...
```

### `hooks/`

Shared, non-feature-specific hooks. These are reusable across features. Examples: `useDebounce`, `usePagination`, `useCurrentUser`. Hooks that are specific to a single feature live inside that feature's directory, not here.

### `services/`

The API layer. This directory is the only place where HTTP requests are made.

Each service file corresponds to a resource:

```
services/
├── api.ts            # Axios instance, interceptors, base config
├── features.ts       # Feature request endpoints
├── voting.ts         # Vote / unvote endpoints
├── categories.ts     # Category endpoints
├── statuses.ts       # Status endpoints
└── auth.ts           # Auth endpoints
```

Service functions:
- accept typed input parameters
- call the Axios instance
- return typed response data (unwrapped from the `data` envelope)
- do not contain UI logic, state, or React concerns

### `types/`

Shared TypeScript types and interfaces that are used across multiple features. Types local to a single feature stay in that feature's directory.

```
types/
├── api.ts           # Envelope types (ApiResponse, PaginatedResponse, ApiError)
├── feature.ts       # FeatureRequest, FeatureRequestSummary
├── vote.ts          # VoteResponse
├── category.ts      # Category
├── status.ts        # Status
└── user.ts          # User, AuthUser
```

All types must reflect the API contract exactly. Field names match the API response (`snake_case`). No renaming or transformation at the type boundary.

### `utils/`

Pure functions with no React or domain dependencies. Examples: date formatting, string truncation, URL building for query params. If a utility function requires React or domain context, it is not a utility — it belongs in `hooks/` or a feature.

---

## 4. Component Architecture

### Presentational components

Located in `components/` or `features/*/components/`.

Rules:
- All data arrives via props. No exceptions.
- No API calls. No TanStack Query usage.
- No domain-specific logic (status transitions, vote constraints, ranking).
- Typed props interface required on every component.
- May contain UI state (hover, open/closed, active).

### Container components (data-aware)

Located in `features/*/` or `pages/`.

Rules:
- Fetch data via custom hooks from the feature directory.
- Pass data down to presentational components as props.
- Own the loading, error, and empty state rendering for their scope.
- Do not mix data fetching with dense JSX. Extract presentational structure.

### Component size

A component that cannot be read in one screen is too large. Extract sub-components. The threshold is judgment-based but strictly applied.

---

## 5. Data Fetching Strategy

All data fetching is managed by TanStack Query. All HTTP calls originate from `services/`.

### Flow

```
Component / Feature
    ↓ calls
Custom hook (useFeatureList, useFeatureDetail, useCastVote)
    ↓ calls
Service function (features.getList, features.getById, voting.vote)
    ↓ calls
Axios instance (services/api.ts)
    ↓
Backend API
```

No step in this chain may be bypassed.

### Query keys

Query keys are defined as constants in the relevant service or feature directory. They are never inline strings scattered across hook calls.

```ts
// features/feature-requests/queryKeys.ts
export const featureKeys = {
  all: ['features'] as const,
  list: (params: FeatureListParams) => ['features', 'list', params] as const,
  detail: (id: number) => ['features', 'detail', id] as const,
}
```

### Response unwrapping

The Axios instance's response interceptor unwraps the API envelope. Service functions receive the `data` payload directly, not the full `{ data, meta }` wrapper. Pagination `meta` is returned alongside `data` for list responses as a named tuple or structured return.

```ts
// services/features.ts
async function getList(params: FeatureListParams): Promise<{ items: FeatureRequest[]; meta: PaginationMeta }> {
  const response = await apiClient.get('/api/features/', { params })
  return { items: response.data.data, meta: response.data.meta }
}
```

### Mutations

Mutations (create, update, vote, unvote, delete) use TanStack Query's `useMutation`. On success, they invalidate the relevant query keys to trigger a refetch. They do not manually update the cache with assumed state — they let the server response drive the next render.

**Vote / unvote exception:** The vote and unvote mutation responses contain `has_voted` and `vote_count`. These are used to optimistically update the specific feature's cache entry to avoid a full list refetch on every vote interaction. This is the only permitted form of optimistic update. All other mutations invalidate and refetch.

---

## 6. State Management Strategy

### Tiers of state

| State type        | Where it lives                  | Examples                                 |
|-------------------|---------------------------------|------------------------------------------|
| Server state      | TanStack Query cache            | feature list, feature detail, categories |
| Local UI state    | `useState` / `useReducer`       | modal open, active filter tab, form      |
| Shared UI state   | React Context (limited scope)   | current user, auth state                 |
| Global app state  | Not used                        | —                                        |

### Rules

- Server state is owned by TanStack Query. It is never duplicated into `useState` or Context.
- React Context is used only for stable, low-frequency state: the current authenticated user, theme preference. It is not used for feature list data, vote state, or any server-derived value.
- `useReducer` is used when a component has multiple related state fields that change together. It is not used as a substitute for a proper state management library.
- There is no Redux, Zustand, Jotai, or other global state library. If a future requirement demands it, it must be added with explicit justification and documentation.

### Current user

The authenticated user is fetched once on app load via `GET /api/users/me/` and stored in a Context provider. All components that need the current user read from this context. The context value is the API response shape — it is not transformed or extended locally.

---

## 7. API Integration

### Response contract

The API returns a consistent envelope:

```ts
// Success
{ data: T, meta: PaginationMeta | null }

// Error
{ error: { code: string, message: string, details: Record<string, string[]> | null } }
```

The Axios instance handles error responses. Non-2xx responses are caught by the response interceptor and thrown as structured `ApiError` objects with `code`, `message`, and `details` fields.

### Domain field mapping

The frontend consumes these fields exactly as returned. No aliasing.

| API field     | Type      | Usage                                                                      |
|---------------|-----------|----------------------------------------------------------------------------|
| `vote_count`  | `number`  | Displayed as-is. Never computed locally.                                   |
| `has_voted`   | `boolean` | Drives the vote button active state. Source: API only.                     |
| `status`      | `object`  | `{ id, name, color, is_terminal }`. Rendered using `name` and `color`.     |
| `category`    | `object`  | `{ id, name, icon, color }`. Rendered using `name`, `icon`, and `color`.   |
| `author`      | `object`  | `{ id, name }`. Only these fields are available. Email is never present.   |
| `rate`        | `number`  | Displayed as-is. Never used in any sort or ranking logic in the frontend.  |

### Prohibited assumptions

- The frontend must not assume `has_voted` based on local interaction history. After a vote or unvote, `has_voted` is read from the mutation response.
- The frontend must not compute `vote_count` by incrementing or decrementing locally, except in the explicitly permitted optimistic update for vote/unvote (Section 5).
- The frontend must not assume a user is an admin based on anything other than what the API communicates (e.g., a `role` field on the current user response or a 403 response).
- The frontend must not send `author_id` or `status_id` in create or update requests from non-admin flows.

### Error handling

- `400` responses expose `error.details` for field-level validation errors. Forms display these errors next to the relevant field.
- `401` responses redirect to the login page.
- `403` responses display a permission-denied message. The user is not logged out.
- `404` responses display a not-found state.
- `500` responses display a generic error message. The raw error is not shown to the user.

---

## 8. Routing Strategy

React Router v6 is used. Routes are defined in a single top-level router configuration.

### Route structure

| Route                     | Page component          | Description                          |
|---------------------------|-------------------------|--------------------------------------|
| `/`                       | `FeatureListPage`       | Paginated ranked list of features    |
| `/features/:id`           | `FeatureDetailPage`     | Single feature request detail view   |
| `/features/new`           | `CreateFeaturePage`     | Authenticated feature submission     |
| `/features/:id/edit`      | `EditFeaturePage`       | Edit own feature (auth required)     |
| `/login`                  | `LoginPage`             | Authentication entry point           |

### Rules

- Route guards are implemented as wrapper components that check the current user context and redirect to `/login` for unauthenticated access to protected routes.
- Route params (`:id`) are read using `useParams` and passed immediately to the relevant hook. They are not passed as props through multiple component layers.
- Navigation after mutations (e.g., after creating a feature) uses `useNavigate`. It is not triggered inside service functions.
- Admin-only pages (if added) follow the same route guard pattern with an additional role check.

---

## 9. UI State Handling

Every async operation has three states: **loading**, **error**, and **success/empty**. All three must be handled. There are no exceptions.

### Loading state

- Rendered using a consistent `Spinner` or skeleton component from `components/`.
- Shown from the moment a request is initiated until the response resolves.
- Must not cause layout shift that breaks the page structure.

### Error state

- All errors surface a visible message to the user. Silent failures are prohibited.
- Validation errors (400) are shown at the field level in forms.
- Non-validation errors (401, 403, 404, 500) are shown as page-level or section-level messages using the `ErrorMessage` component.
- The error message communicates what went wrong in user-facing language. Raw API error strings are not displayed verbatim unless they are already user-safe.

### Empty state

- A list with zero results renders an explicit empty state component, not blank space.
- Empty states must communicate why the list is empty when context is available (e.g., "No features match the selected filters" vs. "No features have been submitted yet").

### Rule

A component that makes an async call and does not handle all three states is incomplete. It must not be merged.

---

## 10. Form Handling

Forms are built with React Hook Form. Validation is split by responsibility.

### Frontend validation (UX only)

The frontend validates:
- Required fields (to prevent pointless empty submissions)
- `rate` range (1–5, to surface errors before the round-trip)
- String length limits that are visible to the user

Frontend validation exists to improve user experience. It does not enforce business rules. A form that passes frontend validation may still be rejected by the backend.

### Backend validation (authoritative)

The backend is the authoritative validator. All `400` responses with `error.details` must be reflected in the form. The form maps `details` field names to the corresponding form field and displays the backend error message under that field.

### Rules

- `react-hook-form`'s `register` is used for uncontrolled inputs. `Controller` is used for controlled inputs (e.g., select, custom components).
- Submit handlers call the service function via a `useMutation` hook. They do not call `fetch` or `axios` directly.
- Form state (submitting, submitted, error) is managed by React Hook Form. It is not duplicated in component state.
- `author_id` is never a form field. It is never included in form submission payloads.
- `status_id` is never a form field in non-admin flows. Admin status change is a separate, explicit interaction — not part of the create or edit form.

---

## 11. Anti-Patterns

The following patterns are prohibited. Code that introduces them must not be merged.

### API calls outside `services/`

API calls must not appear in components, hooks, or utility functions. All HTTP interaction is in `services/`. A component that imports and calls Axios directly violates the architecture.

### Business logic in UI components

UI components do not contain ranking logic, vote constraint logic, status transition checks, or permission derivation. If a component is making domain decisions, that logic belongs in a hook or must come from the API.

### Duplicating backend rules

If the backend enforces a rule (one vote per user, admin-only status changes, deterministic ranking), the frontend does not reimplement it. The frontend defers to the API response. Duplication creates two sources of truth that will diverge.

### Sorting or reordering API responses

The feature list must be rendered in the order the API returns it. The frontend must not sort, re-rank, or reorder the list. Applying any `Array.sort()` to API response data for display purposes is prohibited.

### Deriving `has_voted` or `vote_count` locally

These fields come from the API. The only permitted local update is the optimistic vote/unvote update described in Section 5, which uses values from the mutation response — not locally computed values.

### Reading `author_id` or `status_id` from form submissions in non-admin flows

Non-admin create and edit forms must not include `author_id` or `status_id` in their submission payloads. Including them and relying on the backend to reject them is not acceptable — they must not be submitted.

### Silent failures

Every async call has an error handler. Errors that are caught and swallowed without user-visible feedback are prohibited.

### Global state for server data

Server data (feature list, vote state, user data) lives in TanStack Query. It must not be copied into React Context or module-level variables to share across components. Components that need the same data use the same query key and share the cache automatically.

### Inline query keys

Query keys must not be inline strings or arrays defined inside hook calls. They are defined as constants in query key files and referenced by name.

### Unguarded route access

Protected routes must be wrapped in a route guard component. Pages that require authentication must not render and then redirect — they must redirect before rendering.
