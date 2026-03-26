# React + TypeScript Standards

This document defines the mandatory coding standards for all React and TypeScript code in `frontend/`. Every rule here is enforceable. No rule is optional. Personal preference does not override this document.

This document is aligned with:
- `docs/architecture/frontend-architecture.md` — structural and architectural rules
- `docs/architecture/system-overview.md` — system boundaries and actor model
- `docs/domain/feature-voting.md` — domain rules that must not be reimplemented in UI
- `docs/engineering/backend/api-conventions.md` — API contract shapes and field semantics

---

## 1. Core Principles

These principles govern every decision in this codebase. They are not suggestions.

### Readability over cleverness

Code is read far more often than it is written. A clever one-liner that requires decoding is always worse than three readable lines. If understanding a piece of code requires holding more than one level of abstraction in your head simultaneously, it must be simplified.

### Consistency over personal preference

Every structural and naming decision follows the rules in this document. Developer preference is not a valid reason to deviate. Consistency makes code navigable for humans and predictable for AI-assisted development.

### Composition over monolithic components

Large components that mix layout, data fetching, domain logic, and rendering are prohibited. Prefer many small, focused components composed together. A component that cannot be understood in isolation is too large.

### Explicit types over weak typing

Every public interface — props, function signatures, API responses, hook return values — is explicitly typed. Inference is permitted only for local variables where the type is immediately obvious. `any` is prohibited without exception.

### Frontend reflects backend truth

The frontend does not hold an independent view of the domain. It renders what the API returns. State that exists in the backend — vote counts, vote status, feature rankings, status lifecycle — is sourced exclusively from API responses. The frontend does not compute, derive, or contradict this data.

### Business and domain rules must not be reimplemented in UI code

If a rule exists in the backend (one vote per user, admin-only status changes, deterministic ranking by `vote_count`), it must not be duplicated in frontend code. The frontend defers to the API. Reimplementation creates divergence.

### Each file and directory must have a clear and narrow responsibility

If you cannot describe the responsibility of a file in one sentence, the file does too much. Split it.

### Prohibited behaviors

The following are forbidden unconditionally:

- Implicit behavior — code must not produce side effects that are not obvious from reading the function signature and call site
- Hidden side effects — effects inside render logic, unexpected mutations, or state changes buried in utility functions
- Mixed responsibilities in the same component — UI rendering and API interaction and form orchestration in one component
- Arbitrary structure — directory layout or file placement based on developer preference rather than this document

---

## 2. Naming Conventions

### Directories and files

| Artifact               | Convention    | Example                             |
|------------------------|---------------|-------------------------------------|
| All directories        | `kebab-case`  | `feature-requests/`, `vote-button/` |
| Component directories  | `kebab-case`  | `feature-request-card/`             |
| Feature directories    | `kebab-case`  | `feature-list/`, `voting/`          |
| Utility files          | `kebab-case`  | `format-date.ts`, `build-url.ts`    |
| Hook files             | `kebab-case`  | `use-feature-votes.ts`              |
| Service files          | `kebab-case`  | `features.ts`, `voting.ts`          |
| Type files             | `kebab-case`  | `feature.ts`, `vote.ts`             |
| Test files             | Match source  | `index.test.tsx`, `helpers.test.ts` |

### Code identifiers

| Artifact                   | Convention              | Example                                      |
|----------------------------|-------------------------|----------------------------------------------|
| React components           | `PascalCase`            | `FeatureRequestCard`, `VoteButton`           |
| Custom hooks               | `camelCase` with `use`  | `useFeatureList`, `useCastVote`              |
| TypeScript interfaces      | `PascalCase`            | `FeatureRequest`, `VoteResponse`             |
| TypeScript type aliases    | `PascalCase`            | `ApiError`, `PaginationMeta`                 |
| Props interfaces           | `PascalCase` + `Props`  | `FeatureRequestCardProps`, `VoteButtonProps` |
| Constants (module-level)   | `SCREAMING_SNAKE_CASE`  | `DEFAULT_PAGE_SIZE`, `MAX_RATE`              |
| Constants (local / inline) | `camelCase`             | `maxLength`, `defaultLimit`                  |
| Event handlers             | `camelCase` with `on`   | `onVoteClick`, `onSubmit`, `onStatusChange`  |

### Rules

- Do not mix casing styles for the same category of artifact.
- Do not use vague names: `thing`, `helper`, `data`, `misc`, `stuff`, `temp`, `utils2` are prohibited.
- Names must reflect what the artifact does or represents. `FeatureRequestCard` is correct. `Card` is not.
- Abbreviations are prohibited unless universally understood (e.g., `id`, `url`).
- A hook file named `use-feature-votes.ts` contains the hook `useFeatureVotes`. File name and primary export must correspond.

---

## 3. Directory and File Structure

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

**Purpose:** Route-level entry components. One file per route.

**May contain:** A single page component per file, importing from `features/` and `components/`.

**Must not contain:** Reusable components, shared hooks, API calls, business logic, or form orchestration. Pages assemble features and components — they do not own logic.

### `components/`

**Purpose:** Reusable, domain-agnostic presentational UI components.

**May contain:** Button, Badge, Modal, Spinner, Pagination, EmptyState, ErrorMessage, and similar UI primitives. Each in its own `kebab-case` directory with an `index.tsx` entry.

**Must not contain:** Domain-specific logic, API calls, TanStack Query usage, or components that are only used inside one feature.

```
components/
├── vote-button/
│   └── index.tsx
├── feature-request-card/
│   ├── index.tsx
│   └── types.ts
├── status-badge/
│   └── index.tsx
└── empty-state/
    └── index.tsx
```

### `features/`

**Purpose:** Domain-specific groupings of UI, hooks, and local components. Each feature maps to a domain concept.

**May contain:** Feature-local components, feature hooks, and feature-local types. Each feature is a subdirectory.

**Must not contain:** Shared utility components or logic used by other features. Cross-feature dependencies signal that something belongs in `components/`, `hooks/`, or `types/`.

```
features/
├── feature-requests/
│   ├── components/
│   │   ├── feature-list-filters/
│   │   │   └── index.tsx
│   │   └── feature-detail-header/
│   │       └── index.tsx
│   ├── hooks/
│   │   ├── use-feature-list.ts
│   │   └── use-feature-detail.ts
│   ├── query-keys.ts
│   └── index.ts
├── voting/
│   ├── components/
│   │   └── vote-action/
│   │       └── index.tsx
│   ├── hooks/
│   │   └── use-vote.ts
│   └── index.ts
├── categories/
└── statuses/
```

### `hooks/`

**Purpose:** Shared hooks used across multiple features.

**May contain:** `useDebounce`, `usePagination`, `useCurrentUser`, `useQueryParams`. Hooks that are specific to one feature live in `features/<feature>/hooks/`, not here.

**Must not contain:** Hooks that are only used in one feature, or hooks that make direct API calls (those belong in the feature's hooks, which call `services/`).

### `services/`

**Purpose:** The API layer. All HTTP calls originate here.

**May contain:** One file per API resource. Each file exports typed async functions that call the Axios instance and return unwrapped response data.

**Must not contain:** React code, state, JSX, or any UI concern. Services are pure async functions.

```
services/
├── api.ts           # Axios instance, interceptors, error normalization
├── features.ts      # /api/features/ endpoints
├── voting.ts        # /api/features/{id}/vote/ endpoints
├── categories.ts    # /api/categories/ endpoints
├── statuses.ts      # /api/statuses/ endpoints
└── auth.ts          # Auth endpoints
```

### `types/`

**Purpose:** Shared TypeScript types used across multiple features or layers.

**May contain:** API response shapes, domain entity types, envelope types, pagination types.

**Must not contain:** Per-component prop types (those live in the component), one-off types that are only used in one file (those stay local).

```
types/
├── api.ts        # ApiResponse<T>, PaginatedResponse<T>, ApiError
├── feature.ts    # FeatureRequest, FeatureRequestSummary
├── vote.ts       # VoteResponse
├── category.ts   # Category
├── status.ts     # Status
└── user.ts       # User, AuthUser
```

### `utils/`

**Purpose:** Pure functions with no React, domain, or API dependencies.

**May contain:** Date formatting, string utilities, URL query string builders, number formatting.

**Must not contain:** React hooks, API calls, domain logic, or anything that requires context to run. If a "utility" needs React or domain knowledge, it is not a utility — it belongs in `hooks/` or a feature.

---

## 4. Component Standards

### One responsibility per component

A component has one job. It either renders UI from props, or it fetches data and passes it to a presentational component. It does not do both.

### When to create a new component

Extract a new component when:
- A section of JSX is used in more than one place
- A section of JSX is large enough that naming it clarifies the parent's intent
- A section of JSX has its own conditional rendering, local state, or event handling that is independent of the parent

### When to keep logic inline

Keep logic inline when:
- The JSX is short (under ~15 lines) and its purpose is clear without a name
- Extracting it would create a component that is only ever used in one place and adds no clarity
- The extraction would require passing so many props that the abstraction is less readable than the inline version

### When to compose smaller components

Always prefer composition. A `FeatureListItem` that renders title, vote count, status badge, and author is composed of `StatusBadge`, `VoteCount`, and `AuthorLabel` — each responsible for one thing.

### Props

- Every prop is explicitly typed via a `Props` interface.
- Props must be minimal. Do not pass data that the component does not use.
- Do not pass entire objects when only one field is needed, unless the object is a natural domain unit (e.g., a `FeatureRequest` object to a card component).
- Boolean prop names use the `is`/`has`/`can` prefix: `isLoading`, `hasVoted`, `isDisabled`.
- Callback prop names use the `on` prefix: `onVote`, `onSubmit`, `onClose`.

### Forbidden component patterns

- A component that fetches data, renders a form, validates input, and handles domain logic is prohibited. It must be decomposed.
- JSX that contains inline data transformation (`array.filter().map().reduce()` chains inside the return statement) is prohibited. Derive data before the return.
- A component that renders meaningfully different UI based on deeply nested conditional logic must be split into separate components for each case.

---

## 5. Component Folder Standard

Every reusable component lives in its own directory. No exceptions.

### Structure

```
components/<component-name>/
├── index.tsx          # required — main component export
├── types.ts           # optional — component-local types
├── constants.ts       # optional — component-local constants
├── helpers.ts         # optional — pure functions used only by this component
└── index.test.tsx     # optional — component tests
```

### Rules

- The directory name is `kebab-case`. Always.
- The entry point is always `index.tsx`. Not `FeatureRequestCard.tsx`, not `component.tsx`, not `main.tsx`.
- The main component exported from `index.tsx` is `PascalCase` and matches the conceptual name: a directory named `feature-request-card/` exports `FeatureRequestCard`.
- Files inside the component directory belong exclusively to that component. If a helper is used by two components, it moves to `utils/` or a shared hook.
- Do not export multiple unrelated components from the same folder. If two components are grouped, they must be intentionally related (e.g., a compound component pattern), and this must be documented in a comment.

### Examples — correct

```
components/feature-request-card/index.tsx     ✓
components/vote-button/index.tsx              ✓
features/feature-list/components/feature-list-filters/index.tsx  ✓
```

### Examples — prohibited

```
components/FeatureRequestCard.tsx             ✗  (flat file, wrong casing)
components/cards/FeatureCard.tsx              ✗  (wrong casing, wrong grouping)
components/feature-request-card/card.tsx      ✗  (wrong entry file name)
components/misc/index.tsx                     ✗  (vague name)
```

---

## 6. TypeScript Standards

### `any` is prohibited

There are no exceptions. If an external library returns `unknown` or an untyped shape, write an explicit type for what you expect and assert it in one place with a comment explaining why.

### Props must be explicitly typed

Every component has a `Props` interface. It is defined in the same file as the component unless it is also used elsewhere, in which case it moves to `types.ts` within the component folder or to `types/` if shared across features.

```ts
interface FeatureRequestCardProps {
  feature: FeatureRequestSummary
  onVote: (id: number) => void
  isVoting: boolean
}
```

### API response shapes must be explicitly typed

All types that represent API payloads live in `types/`. They match the API contract field-for-field. Field names are `snake_case` to match the API response. No renaming at the type boundary.

```ts
// types/feature.ts
interface FeatureRequest {
  id: number
  title: string
  description: string
  rate: number
  vote_count: number
  has_voted: boolean
  status: Status
  category: Category
  author: AuthorSummary
  created_at: string
  updated_at: string
}
```

### Interfaces vs type aliases

- Use `interface` for object shapes that represent a named domain concept or a component's props.
- Use `type` for unions, intersections, mapped types, or aliases for primitive combinations.

```ts
// interface — named domain concept
interface Category {
  id: number
  name: string
  icon: string
  color: string
}

// type alias — union
type SortDirection = 'asc' | 'desc'
type FeatureSort = '-vote_count' | 'vote_count' | '-created_at' | 'created_at'
```

### Where types live

| Type                           | Location                                         |
|--------------------------------|--------------------------------------------------|
| API response shapes            | `types/<resource>.ts`                            |
| Shared domain types            | `types/<resource>.ts`                            |
| Component props (local only)   | Same file as the component, or `types.ts` in the component folder |
| Feature-local types            | `features/<feature>/` directory                  |
| Hook return types              | Same file as the hook                            |

### Unsafe assertions

Type assertions (`as SomeType`) are prohibited unless the assertion is justified by a comment explaining why the cast is safe and what guarantees it. Assertions used to silence TypeScript errors without reasoning are prohibited.

### Inferred types

Inference is acceptable for:
- Local variables with obvious types (`const label = 'Vote'`)
- Return types of short functions where the return is a single expression
- `useState` where the initial value makes the type unambiguous

Inference is not acceptable for:
- Function parameters
- Hook inputs and outputs
- API response handling

---

## 7. Hook Standards

### Naming and location

- Every custom hook starts with `use`. A function that does not start with `use` is not a hook.
- Hook files use `kebab-case`: `use-feature-list.ts`, `use-cast-vote.ts`.
- Hooks shared across features live in `hooks/`. Hooks used by one feature live in `features/<feature>/hooks/`.

### What a hook is for

A hook encapsulates reusable stateful logic. Examples:
- Fetching and caching a list of features (`useFeatureList`)
- Managing a paginated query with filter state (`useFeatureListFilters`)
- Casting a vote and handling the mutation lifecycle (`useCastVote`)
- Reading and parsing query params (`useQueryParams`)

### When to create a hook

Create a hook when:
- The same stateful logic is used in more than one component
- A component's stateful logic is complex enough that extracting it makes the component readable
- The logic wraps a TanStack Query `useQuery` or `useMutation` with specific configuration

### When to keep logic in a component

Keep logic in a component when:
- It is simple, short, and component-specific
- Extracting it would create a hook that is only ever called in one place and adds no clarity

### When logic belongs in `services/` instead

Logic that makes HTTP calls belongs in `services/`. A hook wraps the service call in TanStack Query. A hook must not be the place where the Axios call is made.

### Hook structure

A hook must expose a clear, typed return value. Inputs are typed parameters. Side effects are explicit.

```ts
function useFeatureList(params: FeatureListParams): {
  features: FeatureRequest[]
  meta: PaginationMeta | null
  isLoading: boolean
  isError: boolean
  error: ApiError | null
} { ... }
```

### Forbidden hook patterns

- A hook that accepts untyped parameters
- A hook that mixes domain orchestration (submit a form, vote, change status) in a single function
- A hook named `useData`, `useHelper`, `useStuff`
- A hook that makes direct HTTP calls instead of going through `services/`
- A hook with side effects that are not evident from its name and return value

---

## 8. API Interaction Rules

### Where API calls are made

API calls are made exclusively in `services/`. Components, hooks, utilities, and pages do not call `fetch`, `axios`, or any HTTP client. A hook wraps a `services/` function inside a TanStack Query `useQuery` or `useMutation`. That is the only permitted path.

```
Component
  → calls custom hook
    → uses TanStack Query (useQuery / useMutation)
      → calls services/ function
        → calls Axios instance (services/api.ts)
```

### Consuming API fields

| Field         | Rule                                                                                    |
|---------------|-----------------------------------------------------------------------------------------|
| `vote_count`  | Rendered as returned. Never incremented or decremented locally except in the permitted vote/unvote optimistic update. |
| `has_voted`   | Drives vote button state. Read from API response and from vote/unvote mutation response. Never derived locally. |
| `status`      | Rendered using `status.name` for display text and `status.color` for visual styling. `is_terminal` drives whether terminal-state UI is applied. |
| `category`    | Rendered using `category.name`, `category.icon`, and `category.color`. Never hard-coded by name in conditional logic. |
| `author`      | Only `author.id` and `author.name` are available. No other user fields exist on this object. |
| `rate`        | Displayed as-is. Never used in any sort, rank, or filter computation in the frontend.   |

### Envelope handling

The Axios instance response interceptor unwraps the `{ data, meta }` envelope. Service functions return typed payloads, not raw envelope objects. Components and hooks never access `.data.data` or `.data.meta`.

### Field naming

API field names are `snake_case`. Types in `types/` match this exactly. No camelCase aliases are introduced at the type boundary.

### Error handling

The Axios instance normalizes errors into `ApiError` objects with `code`, `message`, and `details`. Hooks expose `error: ApiError | null`. Components use `error.code` to determine how to render error states. Raw error strings from the backend are never rendered directly in UI without sanitization.

### Forbidden patterns

- Components importing and calling `axios` directly
- Components importing and calling service functions directly (hooks are the intermediary)
- Renaming or re-mapping `snake_case` API fields arbitrarily across different files
- Computing `vote_count` or `has_voted` from local state
- Sorting the feature list in the frontend — the API response order is the rank order
- Including `author_id` or `status_id` in create/update request bodies from non-admin flows

---

## 9. Form Standards

### Library

React Hook Form is used for all forms. No other form management approach is permitted.

### Uncontrolled vs controlled

- Use `register` for native HTML inputs (text, textarea, number, checkbox).
- Use `Controller` for non-native inputs (custom select, date picker, custom number input).
- Do not convert controlled inputs to uncontrolled or vice versa mid-lifecycle.

### Validation responsibilities

Frontend validation is UX-only. It exists to surface obvious errors before a round-trip:
- Required field checks
- `rate` range validation (1–5)
- Title and description length limits

Backend validation is authoritative. A form that passes frontend validation may still be rejected. All `400` responses with `error.details` must be displayed at the field level.

### Mapping backend errors to form fields

After a failed mutation, `error.details` is iterated and errors are set on the corresponding React Hook Form fields using `setError`:

```ts
if (apiError.details) {
  Object.entries(apiError.details).forEach(([field, messages]) => {
    form.setError(field as keyof FormFields, { message: messages[0] })
  })
}
```

### Submit flow

1. User submits the form.
2. React Hook Form runs frontend validation. If it fails, errors are shown immediately with no API call.
3. If it passes, the `useMutation` hook is called with the form values.
4. While the mutation is in flight, the submit button is disabled and a loading state is shown.
5. On success, the form is either cleared or the user is navigated away.
6. On error, backend validation errors are mapped to fields. Non-validation errors are shown as a form-level error message.

### Form-specific types

Form field types are defined as a local interface in the same file as the form component, or in the component's `types.ts`. They must not be placed in `types/` unless the shape is reused across multiple forms.

### Forbidden form patterns

- `author_id` as a form field in any non-admin flow
- `status_id` as a form field in create or edit forms for non-admin users
- Form submit handlers that call `axios` or `fetch` directly
- Ignoring backend validation errors
- Form state stored in React Context or TanStack Query — form state is local to the form component

---

## 10. State Management Standards

### Tiers of state and where they live

| State category  | Owner                         | Examples                                                   |
|-----------------|-------------------------------|------------------------------------------------------------|
| Server state    | TanStack Query cache          | Feature list, feature detail, categories, statuses, current user |
| Local UI state  | `useState` in a component     | Modal open, active tab, controlled input value             |
| Shared UI state | React Context (limited scope) | Authenticated user (`AuthContext`)                         |
| Global state    | Not used                      | —                                                          |

### Rules

- Server state is owned by TanStack Query. It must not be copied into `useState` or Context.
- After a mutation succeeds, the relevant query is invalidated and refetched. State is not updated manually except for the explicitly permitted vote/unvote optimistic update.
- React Context is used only for `AuthContext` (the current authenticated user). It must not be used to share feature data, vote state, or any frequently updated server-derived value.
- `useReducer` is used when a component has multiple related state values that change together in response to the same events. It is not a global state substitute.
- No Redux, Zustand, Jotai, or any global state library is used unless explicitly added with justification and documentation.

### What must not be stored redundantly

- `vote_count` for a feature must not exist in both TanStack Query and a `useState` variable simultaneously.
- `has_voted` for a feature must not be shadowed by local state after a vote action — the mutation response updates the cache directly.
- The current user must not be fetched in multiple places and stored separately — `AuthContext` is the single holder.

---

## 11. Rendering Standards

### Async state coverage

Every component that makes or depends on an async operation must handle three states:

1. **Loading** — show a `Spinner` or skeleton; do not render stale or empty content
2. **Error** — show an `ErrorMessage` with user-facing language; never swallow the error silently
3. **Empty** — show an `EmptyState` component with a contextual message; never render blank space

There are no exceptions. A component that handles only the success case is incomplete.

### List rendering

Map over data in a variable before the return statement when the mapping is non-trivial. Inline `.map()` in JSX is acceptable only when the expression is short and the output is simple.

Each item in a list must have a stable, unique `key` prop derived from the item's `id`. Array indices as keys are prohibited for lists that can reorder, filter, or paginate.

### Conditional rendering

Prefer early returns for guarding states (loading, error, empty) before the main render. Avoid deeply nested ternaries. If a condition produces meaningfully different output, extract each branch into a named component or variable.

```tsx
// Correct — early returns, clear main path
if (isLoading) return <Spinner />
if (isError) return <ErrorMessage error={error} />
if (features.length === 0) return <EmptyState message="No features yet." />

return <FeatureList features={features} />
```

```tsx
// Prohibited — nested ternaries
return isLoading ? <Spinner /> : isError ? <ErrorMessage error={error} /> : features.length === 0 ? <EmptyState /> : <FeatureList features={features} />
```

### Data derivation

Compute derived values (filtered lists, formatted strings, sorted subsets) in variables before the return statement. Do not embed `filter`, `map`, `reduce`, or string transformations inside JSX expressions.

---

## 12. Accessibility Standards

### Semantic HTML

Use the correct HTML element for the job. Buttons are `<button>`. Links that navigate are `<a>`. Form fields are `<input>`, `<select>`, or `<textarea>`. Do not use `<div>` or `<span>` with click handlers in place of semantic elements.

### Labels

Every form input has an associated `<label>`. The label is connected via `htmlFor` matching the input's `id`, or via wrapping. Placeholder text is not a substitute for a label.

### Keyboard accessibility

Interactive elements must be reachable and operable via keyboard. Buttons activated by click must also be activated by Enter and Space. Focus must be visible at all times — do not remove the default focus ring without providing a clear replacement.

### Button text

Buttons must have meaningful accessible text. An icon-only button must have an `aria-label` that describes the action. "Vote" is acceptable. An empty button with only an SVG is not.

### Loading and disabled states

Loading states on interactive elements must be communicated to screen readers. Disabled buttons must have `disabled` set (not just a visual style). When a form is submitting, the submit button is `disabled` and its accessible name reflects the in-progress state (e.g., `aria-label="Submitting..."` or visible text "Submitting…").

### ARIA

Use ARIA attributes only when semantic HTML is insufficient. Do not add `role="button"` to a `<div>` — use a `<button>`. Do not add `aria-label` to elements that already have visible, descriptive text.

---

## 13. Anti-Patterns

These patterns are prohibited. Code that introduces them must not be merged.

| Anti-pattern                                               | Rule violated                                    |
|------------------------------------------------------------|--------------------------------------------------|
| Reusable component as a flat `.tsx` file in `components/`  | Section 5: every reusable component needs its own folder |
| Reusable component without `index.tsx` as entry point      | Section 5: entry point is always `index.tsx`    |
| Directory name in `PascalCase` or `camelCase`              | Section 2: all directories use `kebab-case`     |
| API call inside a presentational component                 | Section 8: API calls only in `services/`        |
| Business logic inside a UI-only component                  | Section 4: one responsibility per component     |
| `any` in any TypeScript context                            | Section 6: `any` is prohibited without exception |
| Duplicate types for the same backend entity                | Section 6: shared resource types live in `types/` |
| Hook with unrelated responsibilities combined              | Section 7: hooks have a single clear purpose    |
| Files dumped into `utils/` that are domain- or React-aware | Section 3: `utils/` is for pure, dependency-free functions |
| Sorting the API feature list in the frontend               | Section 8: ranking is server-defined            |
| Deriving `has_voted` or `vote_count` from local state      | Section 8: these fields come from the API       |
| `author_id` or `status_id` in non-admin form payloads      | Section 9: these fields must not be submitted   |
| Async component with no loading, error, or empty handling  | Section 11: all three states are required       |
| Inline ternary chains with three or more branches          | Section 11: use early returns or named components |
| Click handler on a non-interactive element                 | Section 12: use semantic HTML                   |
| Icon-only button without `aria-label`                      | Section 12: buttons must have accessible text   |
