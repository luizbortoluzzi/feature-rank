# ADR-005: Frontend as a Pure API Consumer

## Status

Accepted

## Context

The frontend is a React SPA that renders feature requests, vote states, categories, statuses, and user information. All of this data originates from the backend API.

A recurring architectural tension in full-stack applications is how much domain logic to replicate on the frontend for performance or UX convenience. In practice, this often means:
- computing `vote_count` locally after a vote to avoid a refetch
- sorting or reordering the feature list client-side to reduce API calls
- deriving `has_voted` from interaction history stored in local state
- applying status-based conditional logic based on locally-known rules

Each of these approaches creates a second authority for domain state, which diverges from the backend over time and produces bugs that are hard to reproduce.

The project needed a clear, enforceable principle for where domain logic lives and what the frontend is permitted to do.

## Decision

The frontend is a pure API consumer. It renders what the API returns and delegates all domain decisions to the backend.

Specific rules enforced throughout the frontend:

**Server state ownership:** All server-originated data (feature list, feature detail, categories, statuses, current user) is managed exclusively by TanStack Query. It is never duplicated into `useState` or React Context. The backend is the only authority for `vote_count`, `has_voted`, and list ordering.

**No client-side sorting:** The feature list is rendered in the exact order returned by the API. `Array.sort()` or any other client-side reordering of the feature list is explicitly prohibited. The API's ordering (`vote_count DESC → created_at DESC → id DESC`) is the ranking.

**No local `has_voted` derivation:** The `has_voted` field comes from the API response. After a vote or unvote mutation, TanStack Query invalidates the relevant query key and triggers a refetch, restoring the authoritative value from the backend.

**One permitted optimistic update:** Vote and unvote mutations may use `has_voted` and `vote_count` from the mutation's own response body to update the specific feature's cache entry immediately, providing a snappy UX without waiting for a full list refetch. This is the only permitted optimistic update in the system, and it uses server-confirmed values (the mutation response), not locally-computed ones.

**Strict data-fetching chain:** Every HTTP request follows the same path: `Component → Custom hook → Service function → Axios instance → Backend API`. No component or utility function calls Axios or `fetch` directly. Service functions in `services/` are the only place HTTP calls are made.

**Protected fields never sent:** `author_id`, `status_id` (in non-admin flows), and `vote_count` are never included in form submission payloads. The backend strips or rejects them, but the frontend does not send them in the first place.

**Three-state async handling:** Every async operation has explicit loading, error, and empty states. Silent failures are prohibited. API error shapes (`error.code`, `error.message`, `error.details`) are surfaced to users.

## Consequences

**Benefits:**
- There is one authoritative source for every piece of domain state: the backend. Frontend bugs caused by stale local state or incorrect local computations are eliminated at the architecture level.
- Changes to backend business rules (e.g., ranking algorithm, vote weight, status transition policy) are reflected in the frontend automatically on the next refetch, without requiring any frontend code change.
- The single permitted optimistic update (using mutation response values) provides good UX for the most frequent interaction (voting) without inventing local state.
- Keeping all HTTP calls in `services/` makes the API contract surface easy to audit — all network interactions are in one place.

**Trade-offs:**
- Strict cache invalidation (invalidate + refetch) after mutations introduces a network round-trip that optimistic updates would avoid. The trade-off is correctness over latency, which is appropriate for a voting system where count accuracy matters.
- Enforcing the data-fetching chain requires code review discipline — the architecture does not mechanically prevent a component from calling `fetch` directly.
- TanStack Query's cache invalidation strategy (invalidate on mutation success) means stale data is visible briefly while the refetch is in flight. Loading states must be handled to avoid jarring UI transitions.

## Alternatives Considered

**Local state for vote count (computed increment/decrement):** After voting, increment `vote_count` locally and set `has_voted = true` without a refetch. Faster UX, but the local count can diverge from the backend if concurrent voters exist, if the mutation fails silently, or if the component unmounts and remounts. Rejected in favor of the permitted optimistic update using the mutation response.

**Client-side sorting with full data fetch:** Fetch all features once and sort client-side. Avoids re-fetching on sort parameter change. Requires holding the full dataset in memory and duplicates the ranking logic. Rejected.

**Redux or Zustand for server state:** A global state store that holds fetched data. Adds a synchronization layer between the store and the API. TanStack Query already manages server state lifecycle (fetching, caching, invalidation, stale-while-revalidate) without this synchronization burden.

**Direct Axios calls in components:** Simpler for small components, but scatters HTTP interaction across the codebase, making the API contract surface hard to track and test.

## Evidence

- `frontend/src/services/` — `features.ts`, `voting.ts`, `categories.ts`, `statuses.ts`, `auth.ts`, `auth-token.ts` contain all HTTP calls; no Axios calls exist outside this directory
- `frontend/src/features/` — domain-specific feature groupings with their own hooks; no direct API calls
- `frontend/src/services/api.ts` — centralized Axios instance; all service functions use this instance
- `frontend/vite.config.ts` — `/api` proxy configured for the dev server; no service function constructs its own base URL
- `.claude/rules/frontend-rules.md` — enforceable constraint set documenting all the above patterns, including the one permitted optimistic update, the chain requirement, and the list of forbidden behaviors
- `docs/architecture/frontend-architecture.md` — authoritative frontend architecture specification
- `docs/engineering/frontend/state-management.md` — TanStack Query usage rules and cache invalidation strategy
- `docs/engineering/frontend/api-consumption.md` — query key management, hook structure, error handling
