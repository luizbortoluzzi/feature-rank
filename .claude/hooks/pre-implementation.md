# Pre-Implementation Hook

## Trigger

Run before implementing any non-trivial change. "Non-trivial" means any of:
- creating or modifying a model, serializer, service, selector, view, or permission class
- creating or modifying a component, hook, service function, or page
- adding, removing, or changing an API field, status code, or response shape
- changing how votes, ranking, status, or permissions behave
- any change that crosses the frontend/backend boundary

Do not write any implementation code before completing this checklist.

---

## Step 1 — Identify Scope

Answer each question before proceeding.

1. **Which layer is affected?**
   - Backend only (`backend/`)
   - Frontend only (`frontend/`)
   - Both layers (cross-layer)

2. **What entities are touched?**
   List every model, serializer, service, selector, view, hook, component, or type that will be created or modified.

3. **What behavior changes?**
   State precisely what will be different after the change. Use before/after form if modifying existing behavior.

4. **Is this a cross-layer change?**
   If yes: stop. Define the API contract change first. Do not modify either layer until the contract is agreed. See `docs/engineering/backend/api-conventions.md`.

5. **Is this a new API endpoint or a change to an existing one?**
   If yes: name the endpoint, the method, the request shape, and the response shape before writing any code.

---

## Step 2 — Documentation Discovery

Read every document that governs the affected area. Do not skip this step.

### Always read

- `docs/architecture/system-overview.md` — system invariants (§6). Any change that violates an invariant is blocked before implementation begins.
- `docs/domain/feature-voting.md` — domain rules. Changes must not reimpliment or contradict these.

### For backend changes

- `docs/architecture/backend-architecture.md` — layer responsibilities and ownership boundaries
- `docs/engineering/backend/data-modeling.md` — field types, constraints, `on_delete` directives, index requirements
- `docs/domain/voting-rules.md` — voting invariants, ranking rules, concurrency requirements
- `docs/engineering/backend/api-conventions.md` — response envelope, status codes, field naming, pagination, sorting
- `docs/engineering/backend/security.md` — authentication, permission classes, protected fields, rate limiting

### For frontend changes

- `docs/architecture/frontend-architecture.md` — directory structure, component architecture, data flow
- `docs/engineering/frontend/react-standards.md` — naming conventions, component rules, hook rules, TypeScript standards
- `docs/engineering/frontend/api-consumption.md` — service layer rules, Axios instance, response handling, optimistic update procedure
- `docs/engineering/frontend/state-management.md` — state tiers, ownership rules, forbidden patterns, anti-patterns
- `docs/engineering/frontend/ui-ux-guidelines.md` — UX completeness requirements, feedback states, empty states
- `docs/engineering/backend/api-conventions.md` — the contract the frontend consumes

### For cross-layer changes

Read all documents listed above.

**Forbidden:** Proceeding without reading the governing documents. "I already know what they say" is not sufficient. Read them.

---

## Step 3 — Constraint Identification

After reading the governing documents, extract every applicable constraint for this change. Record them explicitly.

### For backend changes, verify and state:

- [ ] Which layer owns this logic (view / service / selector / serializer / model)?
- [ ] Are there field-level constraints from `data-modeling.md` that apply (types, lengths, nullability, `on_delete`)?
- [ ] Are there vote or ranking invariants from `voting-rules.md` that apply?
- [ ] Are there permission requirements from `security.md` that apply?
- [ ] Are there API response shape requirements from `api-conventions.md` that apply?
- [ ] Does this change affect `vote_count`, `has_voted`, `rate`, `author_id`, `status_id`, or `vote`? If yes, name the rules that govern each field.
- [ ] Is a database constraint required (unique, check, index)? If yes, name it.
- [ ] Is a transaction required (multi-step mutation)? If yes, identify the atomic unit.
- [ ] Can this change produce `IntegrityError` on concurrent execution? If yes, describe the catch-and-handle requirement.

### For frontend changes, verify and state:

- [ ] Which directory does this code belong in (`pages/`, `features/`, `components/`, `hooks/`, `services/`, `types/`, `utils/`)?
- [ ] What API fields does this component or hook consume? Are those fields in the API contract?
- [ ] Is this an async-dependent component? If yes, how are loading, error, and empty states handled?
- [ ] Is server state involved? If yes, confirm it stays in TanStack Query — not in `useState`, `useRef`, or Context.
- [ ] Is a mutation involved? If yes, is it vote/unvote (optimistic) or anything else (pessimistic + invalidate)?
- [ ] Does any form submit `author_id`, `status_id`, or `vote_count`? If yes, remove them.
- [ ] Is `rate` used anywhere in a sort, filter, rank, or ordering expression? If yes, remove it.
- [ ] Does any component rely on a field not in the API contract? If yes, stop — defer to the architect.

---

## Step 4 — Implementation Planning

Produce an explicit plan before writing code. The plan must name:

1. **Files to create** — exact paths, per directory ownership rules
2. **Files to modify** — exact paths, with the specific change described
3. **Layer placement justification** — why this logic belongs in the chosen layer
4. **Tests to write** — list every test case required by `docs/engineering/global/testing-strategy.md` for this change

The plan must address:
- All constraints identified in Step 3
- All three async states if any component fetches data
- All negative paths (invalid input, unauthorized access, duplicate operations, missing resources)

**Forbidden:** Starting to write code without a named test list. Tests are not an afterthought.

---

## Blocking Conditions

Stop and surface the issue explicitly if any of the following are true:

- The change violates a system invariant from `docs/architecture/system-overview.md §6`.
- The change requires an API contract update but the contract has not been updated first.
- The requested change reimplements a backend rule in the frontend.
- The change requires `author_id`, `vote_count`, `rate` in ranking, or `status_id` in a non-admin flow — and removing them is not possible within the task scope.
- The governing documents are ambiguous or contradictory on the behavior being implemented. Do not invent behavior. Surface the ambiguity.
- A required database constraint is absent and cannot be added within this task's scope.

---

## Output

After completing this checklist, produce:

```
IMPLEMENTATION PLAN
===================
Layer(s) affected: [backend / frontend / cross-layer]
Entities/files involved: [list]
Governing documents read: [list]
Constraints that apply: [list, traceable to document and section]
Files to create: [list with paths]
Files to modify: [list with paths and description of change]
Tests required: [list with behavior name and test layer]
Blocking issues (if any): [list or "none"]
```

Do not begin writing code until this plan is produced and any blocking issues are resolved.
