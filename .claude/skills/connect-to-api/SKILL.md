---
name: connect-to-api
description: Connect frontend UI to backend API endpoints through the correct data-fetching chain. Service function → query key → hook → component. No shortcuts.
---

# Skill: connect-to-api

## Purpose

Wire frontend UI to backend API endpoints correctly: through the documented chain (`services/` → TanStack Query hook → component), with correct types, correct state ownership, correct async state handling, and correct optimistic update behavior for vote/unvote.

---

## When to Use

- When connecting a component, page, or feature to backend data for the first time
- When consuming a new or changed API endpoint in the frontend
- When adding a mutation (create, update, vote, unvote) to existing UI

---

## Required Inputs

- The UI area to connect (which page, feature, or component)
- The target endpoint(s): HTTP method, URL, and expected behavior

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/engineering/frontend/api-consumption.md` — the complete API layer specification. Service function rules, Axios instance, response handling, query key conventions, optimistic update procedure (§9 for vote/unvote). Read completely.
2. `docs/engineering/frontend/state-management.md` — state tiers and ownership. Server state lives in TanStack Query only. Vote/unvote optimistic update pattern. What is and is not permitted in cache updates.
3. `docs/engineering/backend/api-conventions.md` — exact response envelope shape, field names (`snake_case`), error format, pagination structure, HTTP status codes. The frontend consumes this exactly as documented.
4. `docs/architecture/frontend-architecture.md` — where service files live, where hooks live, what goes where.

**Read if applicable:**
- `docs/domain/voting-rules.md` — required if the integration involves voting, `vote_count`, `has_voted`, or ranking.

---

## Execution Steps

Execute every step in order. Do not write implementation code before Step 3 is complete.

### Step 1 — Write the endpoint contract

Before writing any code, state the full contract for each endpoint being integrated:

```
Endpoint: <METHOD> <URL>
Authentication: required / not required
Request body: <field>: <type>, required/optional
              Forbidden: author_id / vote_count / status_id (non-admin) [keep applicable]
Query parameters: <field>: <type> [if list endpoint]
Success response:
  HTTP: <status code>
  Envelope: { "data": <shape>, "meta": <pagination or null> }
  Fields consumed by UI: <list — from docs/engineering/backend/api-conventions.md>
Error responses:
  <scenario>: HTTP <code>, { "error": { "code", "message", "details" } }
Idempotency: <describe if vote/unvote, or "not applicable">
```

Confirm every field in "Fields consumed by UI" is present in the documented API response. Do not list fields that are not in the contract. If a required field is absent: **stop. Write "API CONTRACT GAP:" and surface to `architect`.**

### Step 2 — Identify or create the service function

Locate the correct service file:
- `services/features.ts` — feature request operations
- `services/voting.ts` — vote and unvote
- `services/categories.ts` — category reads
- `services/statuses.ts` — status reads
- `services/auth.ts` — authentication

If no file exists for this resource, create one following the resource-per-file convention.

Write or verify the service function:

```ts
// services/features.ts
export async function getFeatures(params: GetFeaturesParams): Promise<FeatureListData> {
  const response = await api.get<FeatureListData>('/api/features/', { params });
  return response.data;
  // NOTE: The Axios interceptor in services/api.ts unwraps the envelope.
  // response.data here is the "data" field from { "data": ..., "meta": ... }.
  // response.data is NOT the full envelope object.
}
```

Service function requirements:
- Call the centralized Axios instance from `services/api.ts` — never `fetch`, never a locally instantiated Axios
- Accept typed input parameters
- Return typed, unwrapped payload (the `data` field, post-interceptor)
- Contain no UI logic, no state, no React concerns
- Do not catch errors — error normalization is the Axios interceptor's responsibility

### Step 3 — Define TypeScript types

Write types for the response shape. Field names must be `snake_case`, matching the API response exactly:

```ts
interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  vote_count: number;       // never increment/decrement locally
  has_voted: boolean;       // from API response only
  rate: number;             // display only — never sort/filter/rank by this
  status: { id: number; name: string; color: string; is_terminal: boolean };
  category: { id: number; name: string; icon: string; color: string };
  author: { id: number; name: string };  // no email field
  created_at: string;
  updated_at: string;
}
```

Do not alias `snake_case` fields to `camelCase`. Do not invent fields. Do not omit `is_terminal` from `status` — it is used for terminal-state UI logic.

Place types:
- In the feature's local `types.ts` if used only within one feature
- In `types/<resource>.ts` if shared across multiple features

### Step 4 — Define the query key constant

Define a query key constant in a dedicated key file. Never define query keys as inline strings or arrays inside hook calls.

```ts
// features/feature-list/queryKeys.ts
export const FEATURE_KEYS = {
  all: ['features'] as const,
  list: (params: GetFeaturesParams) => ['features', 'list', params] as const,
  detail: (id: number) => ['features', 'detail', id] as const,
} as const;
```

Check whether a query key for this data already exists in the codebase. If it does, use it. Do not define a second key for the same data.

### Step 5 — Implement the hook

**For reads (`useQuery`):**

```ts
function useFeatures(params: GetFeaturesParams) {
  return useQuery({
    queryKey: FEATURE_KEYS.list(params),
    queryFn: () => getFeatures(params),
  });
}
```

**For mutations (`useMutation`):**

For all mutations **except vote/unvote**: invalidate the relevant query key on success. Do not manually update the cache.

```ts
function useCreateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeatureData) => createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURE_KEYS.all });
    },
  });
}
```

**For vote/unvote only — optimistic update pattern:**

This is the one permitted optimistic update. Follow this pattern exactly:

```ts
function useVote(featureId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => vote(featureId),
    onMutate: async () => {
      // 1. Cancel outgoing refetches for this feature
      await queryClient.cancelQueries({ queryKey: FEATURE_KEYS.detail(featureId) });
      // 2. Snapshot the current cached value
      const previous = queryClient.getQueryData(FEATURE_KEYS.detail(featureId));
      // 3. Apply optimistic estimate
      queryClient.setQueryData(FEATURE_KEYS.detail(featureId), (old: FeatureRequest) => ({
        ...old,
        has_voted: true,
        vote_count: old.vote_count + 1,
      }));
      return { previous };
    },
    onSuccess: (data: VoteResponse) => {
      // 4. Overwrite estimate with actual server values from VoteResponse
      queryClient.setQueryData(FEATURE_KEYS.detail(featureId), (old: FeatureRequest) => ({
        ...old,
        has_voted: data.has_voted,
        vote_count: data.vote_count,
      }));
    },
    onError: (_err, _vars, context) => {
      // 5. Roll back to snapshot on failure
      if (context?.previous) {
        queryClient.setQueryData(FEATURE_KEYS.detail(featureId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FEATURE_KEYS.all });
    },
  });
}
```

The `VoteResponse` type must match the backend contract: `{ feature_request_id: number; has_voted: boolean; vote_count: number }`.

Hook placement rules:
- Feature-specific: `features/<feature-name>/hooks/use<Name>.ts`
- Shared across features: `hooks/use<Name>.ts`

Every hook must have a typed return value.

### Step 6 — Consume API fields correctly in components

In the component consuming the hook:

| Field | Rule |
|---|---|
| `vote_count` | Render as-is. Never add or subtract locally except in the optimistic update above. |
| `has_voted` | Drive button state from this value. Never derive from click history or local state. |
| `status.name` | Use for display text. Never hard-code status name strings in conditional logic. |
| `status.color` | Use for styling. |
| `status.is_terminal` | Use for terminal-state UI logic (e.g., disabling certain actions). |
| `category.name`, `category.icon`, `category.color` | Render as-is. |
| `author.name` | Display only. No `author.email` — it is not in the contract. |
| `rate` | Display as-is. Never use in any sort, filter, rank, or ordering expression. |
| Feature list order | Render in the order returned by the API. Never apply `Array.sort()`. |

### Step 7 — Handle loading, error, and empty states

For every `useQuery` result:

```tsx
const { data, isLoading, error } = useFeatures(params);

if (isLoading) return <Spinner />;
if (error) {
  if (error.status === 401) { navigate('/login'); return null; }
  if (error.status === 403) return <PermissionDenied />;
  if (error.status === 404) return <NotFound />;
  return <ErrorMessage />;
}
if (!data || data.length === 0) return <EmptyState message="No features yet." />;
return <FeatureList features={data} />;
```

For every `useMutation`:
- Disable the triggering button while `isPending` — prevents double-submit
- Show an error message when `isError` — never swallow silently
- Show success feedback if the UX requires it

No async operation may have an undefined state for loading, error, or empty.

### Step 8 — Verify the integration

Before declaring the connection complete:
- [ ] Service function uses `services/api.ts` Axios instance — no direct `axios` or `fetch`
- [ ] Service function does not catch errors
- [ ] Types use `snake_case` field names matching the API contract
- [ ] `status` type includes `is_terminal: boolean`
- [ ] Query key is a constant — not an inline string
- [ ] Hook uses `useQuery` or `useMutation` — not raw `axios`
- [ ] Vote/unvote uses the full optimistic update pattern (snapshot → estimate → overwrite → rollback)
- [ ] All other mutations use invalidate-and-refetch
- [ ] Loading, error, and empty states handled for all `useQuery` calls
- [ ] `isPending` disables the action button for mutations
- [ ] No `Array.sort()` applied to the feature list
- [ ] `vote_count` and `has_voted` not computed locally (only overwritten from server response)
- [ ] No `author_id` or `status_id` in non-admin form payloads

---

## Expected Output

- Service function in the correct `services/` file
- TypeScript types with `snake_case` field names
- Query key constants in a dedicated key file
- Custom hook using `useQuery` or `useMutation`
- Component with loading, error, and empty states
- Vote/unvote using the full optimistic update pattern
- No direct API calls outside `services/`

---

## Failure Conditions

Stop immediately if:
- A required API field is absent from the documented contract — write `API CONTRACT GAP:` and defer to `architect`
- A query key for this data already exists — use it; do not create a second one
- The service layer is missing and no existing file applies — create one, confirm the resource name first

---

## Anti-Patterns — Forbidden

- Calling `axios`, `fetch`, or any HTTP client from components, hooks, or utils
- Instantiating a local Axios instance outside `services/api.ts`
- Duplicating server state into `useState` or Context
- Computing `vote_count` by incrementing or decrementing locally (except the permitted optimistic estimate, immediately overwritten from server response)
- Deriving `has_voted` from click history or local state
- Applying `Array.sort()` to the feature list
- Using `rate` in any sort, filter, rank, or ordering logic
- Defining inline query key strings inside `useQuery` or `useMutation` calls
- Using optimistic updates for any mutation other than vote/unvote
- Swallowing async errors without surfacing them to the user
- Omitting `is_terminal` from the `status` type

---

## References

- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/architecture/frontend-architecture.md`
- `docs/domain/voting-rules.md`
- `.claude/rules/frontend-rules.md`
- `.claude/agents/frontend-engineer.md`
