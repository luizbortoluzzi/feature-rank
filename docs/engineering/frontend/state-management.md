# State Management

This document is the authoritative specification for how state is managed in the React frontend.

It defines where state lives, who owns it, how it flows, and what is prohibited. All frontend code must conform to these rules. This document aligns with and must remain consistent with:

- `docs/architecture/frontend-architecture.md` — technology stack and structural constraints
- `docs/engineering/frontend/api-consumption.md` — API interaction and response handling rules
- `docs/domain/feature-voting.md` — domain rules the frontend must not reimplement

---

## 1. Core Principles

### Backend is the source of truth

All domain state — feature rankings, vote counts, vote status, lifecycle states, categories, statuses — is owned by the backend. The frontend renders what the API returns. It does not maintain a parallel model of domain data.

### Frontend must not create competing sources of truth

When the same data exists in the API response and in a local variable, they will eventually diverge. Divergence is a bug. The rule is: one owner, one location, one update path.

### State must have a single clear owner

Every piece of state has exactly one owner. That owner is responsible for updates. No other component, hook, or module updates state it does not own.

### State exists at the lowest possible level

State that is only needed by one component lives in that component. State that needs to be shared by a subtree lives at the nearest common ancestor. State does not escalate to a higher scope without a concrete reason.

### Duplication of state is forbidden unless explicitly justified

The same value must not exist in two places simultaneously unless a documented exception names it and defines how consistency is maintained. The only documented exception in this codebase is the vote/unvote optimistic update (see Section 10).

**Explicitly forbidden:**
- Copying API response data into `useState` for use in the same render
- Syncing the same server value manually across multiple components
- Deriving backend data locally and storing the result alongside the original
- Hidden state mutations — every state update must be traceable to an explicit setter call

---

## 2. Types of State

There are exactly three types of state in this application. Every piece of state belongs to one of them.

### 2.1 Server State

Server state is data that originates from the API: feature requests, vote counts, vote status, categories, statuses, the current user.

**Where it lives:** TanStack Query cache exclusively. Server state is never copied into `useState`, `useReducer`, `useRef`, or React Context.

**How it is accessed:** Through custom hooks that call `useQuery` or `useMutation` from TanStack Query. Components read server state from hooks — never from the cache directly.

**What it must not do:**
- It must not be duplicated into local component state.
- It must not be transformed and stored back into any state mechanism.
- It must not be manually kept in sync between two locations.

### 2.2 UI State

UI state is state that exists only to manage the interface: modal visibility, active tab, hover state, controlled input values, in-progress form data.

**Where it lives:** `useState` or `useReducer` inside the component that owns the interaction. If multiple related fields change together, `useReducer` is preferred over multiple `useState` calls.

**How it is accessed:** Direct from the owning component or passed as props to children.

**What it must not do:**
- It must not store backend-derived data. A UI state variable that mirrors an API field is a duplicate.
- It must not leak across unrelated components. UI state for a modal belongs to the modal's owner — not in a sibling or a global store.
- It must not substitute for server state. A boolean that tracks "did the user just vote" without using the API response is incorrect.

### 2.3 Shared State

Shared state is state that multiple components across the tree need to access, but that is not owned by the backend. The only shared state in this application is:

- The authenticated user (`AuthContext`), populated from `GET /api/users/me/` on app load.

**Where it lives:** React Context. One provider per logical shared concern at the appropriate tree level.

**How it is accessed:** Via a custom hook that reads the context (`useCurrentUser`). Components do not access Context directly via `useContext` — they call the hook.

**What it must not do:**
- It must not hold server data other than the authenticated user.
- It must not be used to avoid prop drilling as a convenience. That is not a valid reason to introduce Context.
- It must not hold feature list data, vote state, category lists, or any data managed by TanStack Query.

---

## 3. Server State Rules

### Source

Server state comes from the API. It enters the application through service functions called by TanStack Query hooks. No other path introduces server state.

### No manual duplication

When a component needs server state, it calls the relevant hook. It does not copy the value into a `useState` variable to "hold onto it." If TanStack Query has the value in cache, the hook returns it synchronously. No manual copy is needed.

### No manual syncing

Two components that need the same server data use the same query key. TanStack Query provides both components the same cached value. They do not need to pass data between each other or subscribe to a shared variable — the cache does this automatically.

### Updates happen through invalidation

When server state changes (after a mutation), the relevant TanStack Query cache key is invalidated. A background refetch updates all subscribers. Components do not receive a "push" of new data — they re-render when their query key updates.

**Specific rules:**
- `vote_count` must not be manually incremented or decremented in state. It comes from the API. The only exception is the vote/unvote optimistic update (Section 10), which is overwritten by the server response immediately on resolution.
- `has_voted` must not be derived from click history. It comes from the API and from `VoteResponse` on vote/unvote.
- Ranking order must not be recomputed or reapplied in the frontend. The feature list is rendered in the exact order returned by `GET /api/features/`. No `Array.sort()` is applied to the result.
- Client-side overrides of backend data are prohibited.

### Permitted transformations

API data may be transformed only for display purposes, and only at the render site or in a pure utility function. Permitted transformations:

- Formatting ISO timestamps for display: `"2026-01-10T14:23:00Z"` → `"Jan 10, 2026"`
- Truncating `title` or `description` for compact list items
- Constructing a display string from `vote_count`: `38` → `"38 votes"`

These transformations must not mutate the original cached data and must not be stored in any state mechanism.

---

## 4. Local State Rules

### Scope

Local state (`useState`, `useReducer`) is used exclusively for UI concerns that have no representation in the API.

**Valid uses:**
- Modal or dialog open/closed
- Active tab or accordion panel
- Controlled input value while typing (before submission)
- Inline editing mode toggle
- Client-side filter panel selection (the API call is made with the filter applied — the selection itself is local)

**Invalid uses:**
- Storing a copy of a feature request returned from `useQuery`
- Tracking "has the user clicked vote" as a substitute for `has_voted` from the API
- Storing a cached list of categories to avoid re-fetching (TanStack Query does this)
- Any value that duplicates a field in an API response

### No leaking across components

Local state must not be elevated to a parent or sibling component to solve a sharing problem. When two components need to share state, evaluate whether that state should be:
- Lifted to the nearest common ancestor (for local UI state)
- Moved to TanStack Query (if it is server state)
- Moved to Context (only if it is stable, non-server shared state with a clear owner)

Elevating local state to a global store as a shortcut is prohibited.

### Loading state is not local state

`useState(false)` for tracking whether an async operation is in progress is prohibited when TanStack Query already tracks it. Loading state comes from `isLoading`, `isFetching`, or `isPending` on the query or mutation result.

---

## 5. Shared State Rules

### When shared state is permitted

Shared state via React Context is permitted only when:
1. The data is needed by many components across different subtrees.
2. The data is not server state managed by TanStack Query.
3. Prop drilling would require passing the value through three or more unrelated layers.

Currently, the only state that meets these criteria is the authenticated user.

### Where shared state lives

Shared state lives in a React Context provider placed at the appropriate tree level — not necessarily at the root. Providers are placed as low in the tree as the consumers allow.

### AuthContext

The authenticated user is fetched once on app load via `GET /api/users/me/` and stored in `AuthContext`. All components that need the current user call `useCurrentUser()`. The context value is the API response shape — it is not transformed, extended, or supplemented locally.

`AuthContext` is the only Context provider that stores data from the API. It exists because authentication state is a stable, low-frequency concern needed across the entire application. No other server-derived value justifies its own Context provider.

### Ownership

Every Context provider has a single owner component responsible for fetching and updating its value. No other component writes to a context value — they only read it.

**Explicitly forbidden:**
- Using Context to share server data across components as a convenience.
- Creating a Context provider for feature request data, vote state, category lists, or any data TanStack Query can serve from cache.
- Context providers that store values copied from `useQuery` results.
- Storing API data in module-level variables (`let currentFeatures = []`) as a substitute for TanStack Query.

---

## 6. State Ownership

### Every piece of state has exactly one owner

The owner is the component, hook, or context that holds the state and is solely responsible for updating it. State is never written from outside its owner.

### Ownership is explicit

Ownership is determined by where state is declared:
- `useState` / `useReducer` in a component → that component owns it
- TanStack Query cache → TanStack Query owns it; hooks provide read access; mutations trigger invalidation
- React Context → the provider component owns it

No component "guesses" who owns a piece of state. If ownership is unclear, the state is in the wrong location.

### Updates happen at the owner

A component that needs to update state it does not own calls a callback provided by the owner. It does not reach into a sibling, parent, or context and mutate state directly. Hidden mutations — state changes that occur without the owner's explicit setter — are prohibited.

### Ownership determines update paths

When server state changes:
1. A mutation fires via TanStack Query.
2. On success, the mutation handler invalidates the relevant query key.
3. TanStack Query refetches and updates the cache.
4. All components subscribed to that query key re-render with the new value.

No component intervenes in this chain. No component holds a local copy that needs to be updated separately.

---

## 7. Data Flow

### Unidirectional

Data flows in one direction: from the API through TanStack Query into hooks, from hooks into components, from components into children via props.

```
API
 ↓
TanStack Query cache
 ↓
Custom hook (useFeatureList, useFeatureDetail, useCurrentUser)
 ↓
Container component (data-aware, in features/ or pages/)
 ↓ props
Presentational component (data-unaware, UI-only, in components/)
```

No step in this chain is reversed. Presentational components do not fetch data. Service functions do not hold state. Hooks do not pass data upward.

### Parent-to-child via props

A component passes data to its children via props. A child that needs data the parent does not have should reconsider whether the data belongs higher in the tree or in TanStack Query.

### No implicit shared mutation

Shared mutations happen only through:
- Calling a mutation hook that invalidates shared query keys (for server state)
- Calling a Context setter provided by the context owner (for shared UI state)

A component that modifies a sibling's data through a shared variable, module-level state, or a Context setter it does not own introduces an implicit mutation. This is prohibited.

### No bidirectional flows

A component that simultaneously reads from and writes to state it does not own creates a bidirectional flow. This produces unpredictable update cycles. If a component needs to trigger an update in a parent, it does so via a callback prop passed from the parent — not by reaching into shared state.

---

## 8. Derived State

### Do not store derived state

Derived state is a value computed from another piece of state. Storing derived state creates a synchronization obligation: both the original and the derived value must be kept consistent. When they diverge, there is a bug.

Derived state is computed at render time, not stored.

**Values that must not be stored:**
- A filtered subset of the feature list
- A display string computed from `vote_count` (e.g., `"38 votes"`)
- A boolean `hasFiltersApplied` derived from active filter values
- A display label derived from a status name
- Any value computable from current props or query data without side effects

These are computed inline in the render function or in a `useMemo` hook if the computation is genuinely expensive.

### When memoization is justified

`useMemo` is justified when:
- The computation processes a large dataset where recalculation on every render is measurably slow
- The input dependencies are stable and well-defined

`useMemo` is not a default. Wrapping every derived value in `useMemo` is prohibited without a demonstrated performance need.

### Never store derived vote_count or ranking

`vote_count` is returned by the API. Computing it locally and storing the result is prohibited. Ranking is determined by API response order. Computing a ranked list from raw data and storing it is prohibited.

---

## 9. Async State Handling

Every async operation exposes three states. All three must be handled. A component that initiates an async call and does not handle all three states is incomplete and must not be merged.

### Loading state

- Initial data load with no cached data (`isLoading`): render a `Spinner` or skeleton component in place of the content.
- Background refetch with cached data present (`isFetching`): do not show a loading indicator. The existing content remains visible.
- Mutation in progress (`isPending`): disable the triggering control. Do not blank the surrounding UI.
- `useState(false)` for loading that TanStack Query already tracks is prohibited.

### Error state

- Silent failures are prohibited. Every error must surface visible feedback to the user.
- `400` — display `error.details` field errors at the field level in the form via React Hook Form's `setError`. Show `error.message` as a form-level error if `details` is null.
- `403` — display a permission-denied message. Do not log the user out.
- `404` — display a not-found state for the relevant section or page.
- `500` — display a generic error message. The raw backend error string must not be shown.
- Network failures — display a user-visible error state. They are not swallowed.
- `catch (e) {}` and `catch (e) { console.error(e) }` with no UI response are prohibited.

### Success and empty state

- Success with data: render the data.
- Success with zero results: render an explicit `EmptyState` component. Blank space is not acceptable.
- Empty state messages must communicate context: `"No features match the selected filters"` is required over `"No results"` when filters are active.

### State transitions are explicit

Transitions between loading, error, and success are driven by TanStack Query's state fields. They are not managed with `setTimeout` delays, manually triggered flags, or `useEffect` blocks that watch for condition changes.

---

## 10. Voting State Behavior

### Backend is authoritative

`has_voted` and `vote_count` are owned by the backend. After a vote or unvote, the values shown in the UI must come from the `VoteResponse` returned by the API — not from locally computed assumptions.

### The only permitted optimistic update

Vote and unvote are the only mutations in this application permitted to use an optimistic update. This exception is permitted because:
- The API is explicitly idempotent for vote and unvote
- The API always returns the definitive state in `VoteResponse`
- The optimistic estimate is immediately replaced by the server response on resolution

**Optimistic update procedure:**

1. Before the request is sent, snapshot the current cached `has_voted` and `vote_count` for the feature.
2. Apply an optimistic estimate to the cache: flip `has_voted`, adjust `vote_count` by ±1.
3. Send the request.
4. On success: overwrite the cache with the actual `has_voted` and `vote_count` from `VoteResponse`. The estimate is discarded.
5. On failure: roll back the cache to the snapshot from step 1. Show an error state.

The optimistic estimate is a temporary placeholder. It is never treated as a confirmed fact. It is always replaced by the server response.

### Button is disabled during in-flight mutation

While a vote or unvote mutation is in flight (`isPending`), the vote button is disabled. The mutation is not re-triggered by additional clicks. After the mutation resolves, the button re-enables and the UI reflects the `VoteResponse`.

### No local vote tracking

The frontend must not track "did the user vote during this session" in `useState`, `useRef`, or a module-level variable. `has_voted` comes from the API on every load and from `VoteResponse` on every vote action. Local tracking creates a source of truth that diverges from the backend.

### Voting does not trigger a list re-sort

After a vote, the feature list order is not updated by the frontend. The list reflects the server's ranking. If the vote changes the ranking, the next full list refetch will return the new order. The frontend does not reorder the list in response to a vote action.

---

## 11. Form State

### Form state is local

Form state — field values, validation errors, submission status — is managed by React Hook Form. It lives within the form component. It is not promoted to shared state, Context, or TanStack Query cache.

### Submission goes through the API layer

Form submission calls a TanStack Query `useMutation` hook. The mutation calls the service function in `services/`. No form calls `axios` or `fetch` directly, and no form calls a service function directly outside of `useMutation`.

### React Hook Form is the form state manager

`useState` must not be used to track individual form field values when React Hook Form is in use. `register` handles uncontrolled inputs. `Controller` wraps controlled inputs (selects, custom components). Submission status (`isSubmitting`) and form errors come from React Hook Form — not from manually managed booleans or state variables.

### Frontend validation is UX only

The frontend validates required fields, `rate` range (1–5), and visible length limits. This exists to prevent pointless empty submissions and to surface errors before a round-trip. A form that passes frontend validation may still be rejected by the backend. Frontend validation does not enforce business rules.

### Backend validation is authoritative

All `400` responses include `error.details` with field-level messages. These are applied to the form using React Hook Form's `setError`. The message appears under the corresponding field. Backend errors are not shown as toasts or generic alerts — they are shown at the field level.

### Prohibited form fields

- `author_id` must never be a form field and must never appear in a form submission payload. The author is derived server-side.
- `status_id` must never be a form field in non-admin create or edit flows. Admin status changes are a separate, explicit interaction with their own component and hook.

---

## 12. Anti-Patterns

The following behaviors are explicitly prohibited. Any implementation that exhibits them must not be merged.

### Duplicating server state across components

Copying a `useQuery` result into `useState` and passing it as props is prohibited. Components that need the same server data call the same hook with the same query key and share the TanStack Query cache automatically.

### Storing vote_count locally and manually syncing it

`vote_count` must not be held in component state and adjusted by incrementing on vote or decrementing on unvote. The only permitted local adjustment is the optimistic update in Section 10, which is immediately replaced by `VoteResponse`. Any other local management of `vote_count` is prohibited.

### Frontend-side ranking logic

Applying `Array.sort()`, `Array.reverse()`, or any ordering operation to the feature list for display is prohibited. The API response order is the rank order. The frontend renders it as received.

### Global state as a default solution

React Context is not a substitute for TanStack Query for server data, and it is not a shortcut to avoid prop drilling for data that should be local. Reaching for Context before TanStack Query for server data is a misuse of the tool.

### Uncontrolled shared state

State that is read and written by multiple components without a single declared owner is uncontrolled. Multiple components calling a shared setter without coordination is prohibited. Every piece of state has one owner.

### Hidden mutations

State that changes without an explicit setter call is a hidden mutation. `useEffect` blocks that modify state as a side effect of other state changes are the most common source of hidden mutations. If state needs to change when other state changes, compute it as derived state instead of storing a second copy and syncing it in `useEffect`.

### Coupling unrelated components through shared state

Component A and Component B must not communicate by reading and writing the same Context value or module-level variable when they have no direct hierarchical relationship. If they need to share state, that is a signal to examine the component structure — not an invitation to create a shared global variable.

### Loading state in useState

Tracking async in-progress status in a manually managed `useState(false)` boolean is prohibited. TanStack Query's `isLoading`, `isFetching`, and `isPending` fields exist for this purpose.

### Derived state stored alongside its source

Computing a value from server state and storing both the original and the derived value creates a synchronization obligation. If the source updates and the derived value does not, the component is inconsistent. Compute derived values at render time. Do not store them.

### rate used in any filtering, sorting, or ordering expression

`rate` must not appear in any expression that determines ordering of feature requests. It must not be used as a sort key, a filter priority signal, or a ranking tiebreaker. `rate` is displayed as provided. It has no effect on any ordering logic in the frontend.
