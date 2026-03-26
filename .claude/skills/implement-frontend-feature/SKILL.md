# Skill: implement-frontend-feature

## Purpose

Implement frontend features in strict conformance with repository architecture, API contracts, React standards, and UX requirements. This skill governs all frontend work inside `frontend/`.

---

## When to Use

- Any time a UI feature, page, component, or user interaction is required
- When consuming a new or changed API endpoint in the frontend
- When adding or modifying state, hooks, or data-fetching logic

---

## Required Inputs

- A clear description of the feature or change to implement

---

## Execution Steps

Execute every step in order. Do not skip steps.

### Step 1 — Run map-repo

Before writing any code, execute the `map-repo` skill for this task.

The output of `map-repo` must be complete before continuing. Do not proceed without a confirmed list of affected files, applicable invariants, and API contract details.

### Step 2 — Identify affected feature or page

From the task description and `map-repo` output, identify:
- Which page or feature area this change belongs to (e.g., feature list, feature detail, voting, submission form)
- Which existing folder under `frontend/src/` is relevant
- Whether a new folder or route is required

Record these before reading docs.

### Step 3 — Read required documents

Read the following documents in order. Do not skip any.

1. `docs/architecture/frontend-architecture.md` — folder structure, component layer responsibilities, technology stack constraints, what belongs where.
2. `docs/engineering/frontend/react-standards.md` — component rules, naming conventions, hook design, file organization, what must not be done.
3. `docs/engineering/frontend/api-consumption.md` — how API calls are made, where service functions live, response handling patterns, forbidden patterns (no raw fetch in components).
4. `docs/engineering/frontend/state-management.md` — where state lives, global vs local state rules, what must not be duplicated from the API.
5. `docs/engineering/frontend/ui-ux-guidelines.md` — layout requirements, loading state handling, error state handling, empty state handling, visual consistency rules.

Also read the relevant backend contract doc:
- `docs/engineering/backend/api-conventions.md` — exact response envelope shape, field names, pagination structure, error format. The frontend must consume this exactly as defined.

If the feature involves voting or ranking, also read:
- `docs/domain/voting-rules.md` — `vote_count` and `has_voted` are always backend-computed. The frontend must never compute or cache these independently.

### Step 4 — Identify required API calls

From `docs/engineering/backend/api-conventions.md` and the task description, identify:
- Every endpoint this feature will call (method + URL)
- The exact request shape for each call (fields, types)
- The exact response shape for each call (envelope, payload fields)
- The HTTP status codes to handle (success, validation error, unauthorized, not found)

Do not assume endpoint shapes. Read the contract.

If a required endpoint does not exist or does not match the needed shape, stop. Surface the gap and defer to `architect` before implementing.

### Step 5 — Define component structure

Before writing any component code, define the component tree for this feature:

- Which components are new vs existing
- Which component is responsible for data fetching
- Which components receive data as props only (presentational)
- Which hooks are needed
- Where loading, error, and empty states will render

Record this structure explicitly. Follow the folder conventions in `docs/architecture/frontend-architecture.md`.

### Step 6 — Implement service functions

Write or update service functions in the appropriate service file under `frontend/src/`.

Requirements:
- All API calls live in service functions. No `fetch` or `axios` calls inside components or hooks.
- Service functions accept typed parameters and return typed responses.
- Use the response envelope shape from `docs/engineering/backend/api-conventions.md` — always unwrap `data` and handle `meta` for pagination.
- Handle HTTP error responses by throwing typed errors that components can distinguish.
- No business logic in service functions. They are transport only.

### Step 7 — Implement components

Write components following `docs/engineering/frontend/react-standards.md`.

Requirements:
- Components are small and composable. A component that does too much must be split.
- Presentational components receive all data via props. They do not fetch data.
- Container components (or hooks) own data fetching. They do not contain visual layout logic.
- Use explicit TypeScript types for all props. No `any`.
- Follow naming conventions from `docs/engineering/frontend/react-standards.md`.
- Place files in the correct folder per `docs/architecture/frontend-architecture.md`.

Prohibited patterns:
- No business logic in components (e.g., computing vote rank, deriving status transitions)
- No direct API calls in components — use service functions via hooks
- No duplication of backend validation logic
- No storing `vote_count` or `has_voted` in component-local state derived from client-side counting

### Step 8 — Implement hooks (if needed)

Write custom hooks for data fetching or stateful logic that is shared across components.

Requirements:
- Hooks own: API call invocation, loading state, error state, response data state
- Hooks do not own: visual rendering, layout decisions
- Name hooks with the `use` prefix per React convention
- Return a consistent shape: `{ data, isLoading, error }` or equivalent
- Follow patterns in `docs/engineering/frontend/state-management.md`

### Step 9 — Handle all UI states

Every feature that loads data must handle all three states. No exceptions.

**Loading state:**
- Show a loading indicator while the API call is in flight
- Do not render partial or stale data while loading

**Error state:**
- Show a user-facing error message when the API call fails
- Do not expose raw API error details or HTTP status codes to the user
- Provide a recovery action where appropriate (e.g., retry button)

**Empty state:**
- Show a meaningful empty state when the API returns an empty list or no data
- Do not render a blank page or silent failure

Requirements are defined in `docs/engineering/frontend/ui-ux-guidelines.md`. Read them.

### Step 10 — Verify naming and structure compliance

Before finalizing, check:

- All component file names match the naming convention in `docs/engineering/frontend/react-standards.md`
- All files are in the correct folders per `docs/architecture/frontend-architecture.md`
- All TypeScript types are explicit (no `any`)
- All props are typed
- No unused imports, no dead code

### Step 11 — Write tests

Write tests for:
- Component behavior: what renders in each state (loading, error, empty, populated)
- User interactions: button clicks, form submissions, vote toggling
- API integration points: that service functions are called with correct arguments; that responses are handled correctly

Test files are colocated with the components they test, following patterns in the existing codebase.

Do not test backend logic. Do not duplicate backend validation in frontend tests.

---

## Expected Output

- Implemented service functions, components, and hooks for the feature
- All three UI states handled (loading, error, empty)
- Tests covering component behavior and user interactions
- A brief explanation of component structure decisions and how the API contract was consumed

---

## Failure Conditions

Stop and surface the issue if any of the following occur:

- A required API endpoint does not exist or has a shape that does not match `docs/engineering/backend/api-conventions.md` — stop, surface the gap, defer to `architect`
- The feature requires business logic that belongs in the backend — do not implement it in the frontend; surface the gap
- The task requires computing `vote_count` or `has_voted` on the client side — reject this; these are always backend-computed
- A required document does not exist — report the gap, do not assume content
- The component structure cannot satisfy the requirements without violating the folder conventions — surface the conflict before writing code

---

## References

- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/global/testing-strategy.md`
- `.claude/skills/map-repo/SKILL.md`
