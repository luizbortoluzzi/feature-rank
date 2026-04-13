---
name: create-component
description: Create a frontend component in the correct location with correct structure, typed props, and no architecture violations. Check for an existing component before creating a new one.
---

# Skill: create-component

## Purpose

Create a frontend component correctly: right location, right folder structure, typed props, narrow responsibility, no API calls, no business logic. Always check whether an existing component covers the use case before creating a new one.

---

## When to Use

- When creating a new reusable UI component (used across features)
- When creating a new feature-scoped component (used only within one feature)
- When extracting a sub-component from a component that has grown too large

---

## Required Inputs

- Component purpose: what it renders and what interaction it supports
- Whether the component is reusable (used by multiple features) or feature-local (used by one feature only)

If the answer to "reusable or feature-local" is unclear, default to feature-local. Promote to `components/` only when a second consumer exists.

---

## Required Documents — Read Before Acting

**Always read:**
1. `docs/architecture/frontend-architecture.md` — directory structure table. What belongs in `components/` vs `features/*/components/`. Read the directory ownership section.
2. `docs/engineering/frontend/react-standards.md` — naming conventions, file organization, component folder rules, TypeScript requirements, what components must and must not do.

**Read if the component renders async-dependent data:**
- `docs/engineering/frontend/ui-ux-guidelines.md` — loading state, error state, and empty state requirements.

---

## Execution Steps

Execute every step in order.

### Step 1 — Check for an existing component first

Before creating anything, search `frontend/src/components/` and the relevant `frontend/src/features/*/components/` directories for a component that already covers this use case.

If an existing component covers the use case: use or extend it. Do not create a duplicate.

### Step 2 — Confirm the correct location

Apply this rule strictly:

| Component type | Location |
|---|---|
| Reusable — used by two or more features | `frontend/src/components/<component-name>/` |
| Feature-local — used by one feature only | `frontend/src/features/<feature-name>/components/<component-name>/` |

If you are uncertain whether a component is reusable: it is feature-local. Promote to `components/` only when a second feature needs it.

### Step 3 — Create the folder

Create a dedicated folder using `kebab-case`:

Examples:
- `frontend/src/components/vote-button/`
- `frontend/src/features/voting/components/vote-button/`

Do not place the component file directly in a parent directory. Every component has its own folder.

### Step 4 — Create `index.tsx`

The component's entry point is always `index.tsx`. External consumers always import from the folder path, not a named file.

Structure:
```tsx
interface <ComponentName>Props {
  // every prop typed explicitly
}

export function <ComponentName>({ ... }: <ComponentName>Props) {
  return (
    // JSX
  );
}
```

Naming rules:
- Component function: `PascalCase`, matching the folder name in PascalCase form
- Props interface: `<ComponentName>Props`
- Export: named export

Check one existing component in the codebase to confirm the export style convention (named vs default) before writing. Match what exists — do not introduce a different style.

### Step 5 — Define typed props

Every prop must be:
- Explicitly typed — no `any`, no implicit `object`
- Named to match the data it carries

If a prop carries API-sourced data, the field name must match the API field name (`snake_case`) exactly. Do not rename or alias API fields at the props boundary.

Pass only the props the component actually uses. Do not pass entire API response objects when one or two fields are needed.

### Step 6 — Keep responsibility narrow

A component does one thing. Enforce this strictly:

**A component must:**
- Render UI based on props
- Call callback props for user interactions (clicks, changes)

**A component must not:**
- Call service functions
- Import from `services/`
- Call `axios` or `fetch`
- Import from TanStack Query
- Contain domain rule enforcement (vote constraints, status gating, permission derivation)
- Contain domain-derived conditional logic (e.g., `if (status.name === 'rejected')`)
- Sort, filter, or reorder data received via props

If the component would need any of the above to function: redesign the interface. The parent hook or page owns data fetching. The component receives resolved data as props.

### Step 7 — Handle async states when the component renders async-dependent UI

If the component receives data that may be loading, errored, or empty, its props interface must expose this explicitly:

```tsx
interface <ComponentName>Props {
  isLoading: boolean;
  error: Error | null;
  data: <DataType> | undefined;
}
```

Inside the component:
- Loading: render the shared `Spinner` (or skeleton) from `components/` — never render empty content while loading
- Error: render the shared `ErrorMessage` — never swallow errors silently
- Empty (`data` is defined but empty array/null): render the shared `EmptyState` — never render blank space

The parent hook or page resolves the fetch. The component receives these three states as props and renders accordingly. Do not initiate the fetch inside the component.

### Step 8 — Add local files only when justified

Within the component folder, you may add:
- `types.ts` — only if the component's local types are not used anywhere else and are complex enough to warrant separation
- `utils.ts` — only if the component uses a pure transformation used exclusively within this folder
- `<ComponentName>.test.tsx` — always encouraged

Do not add these files speculatively. If the logic fits in `index.tsx` without making it unreadable, keep it there.

### Step 9 — Verify the result

Before declaring the component complete:
- [ ] Folder: `kebab-case`
- [ ] File: `index.tsx` is the sole entry point
- [ ] Component name: `PascalCase`
- [ ] Props interface: `<ComponentName>Props`, all props typed, no `any`
- [ ] Export style: matches the existing codebase convention
- [ ] No service imports, no Axios imports, no TanStack Query imports
- [ ] No domain logic, no business rules, no domain-derived conditionals
- [ ] Location: correct for reusable vs feature-local
- [ ] Loading/error/empty states defined if the component renders async-dependent data

---

## Expected Output

- A correctly placed component folder
- `index.tsx` with the component, its props interface, and no architecture violations
- Optional: `types.ts`, `utils.ts`, or test file if justified by current need

---

## Failure Conditions

Stop if:
- The correct location (reusable vs feature-local) cannot be determined — ask before creating
- The component requires service calls or business logic to function — redesign the interface; the logic belongs in the parent hook or page
- An existing component in the codebase already covers this use case — use or extend it; do not create a duplicate

---

## Anti-Patterns — Forbidden

- Creating a component before checking whether an existing one already covers the use case
- Placing feature-specific components in `components/`
- Placing shared components inside a feature folder
- Creating the file as `ComponentName.tsx` directly in a parent directory without its own folder
- Using `any` for prop types
- Importing from `services/`, `axios`, or TanStack Query inside a component
- Domain logic or business rule enforcement inside components
- Rendering blank space instead of `EmptyState` when a list is empty
- Swallowing async errors without rendering an error message
- Skipping the loading state for async-dependent data

---

## References

- `docs/architecture/frontend-architecture.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `.claude/rules/frontend-rules.md`
- `.claude/agents/frontend-engineer.md`
