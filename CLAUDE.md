# CLAUDE.md

## Purpose

This repository contains a full-stack Feature Voting System built as a monorepo.

The system allows users to:
- submit feature requests
- browse existing requests
- upvote features
- view ranking based on popularity

The goal is to design a production-ready system with strong attention to:
- system design
- scalability
- maintainability
- user experience

---

## Documentation Priority

The `docs/` directory contains authoritative technical and architectural references.

When making decisions:

1. Prefer documented standards over assumptions
2. Align implementation with documented patterns
3. Update docs if implementation changes meaningfully

Docs are part of the system, not optional.

---

## Repository Structure

The repository is organized as follows:

- `frontend/` — React application (Vite + TypeScript)
- `backend/` — Django REST API
- `docs/` — product, architecture, and domain reference material
- `.claude/` — Claude Code configuration (agents, skills, settings)
- `.github/` — CI/CD workflows
- root files — shared configuration and tooling

---

## Core Principles

1. Keep changes small, scoped, and intentional.
2. Preserve clear separation between frontend and backend responsibilities.
3. Treat the system as a real product, not just a coding exercise.
4. Optimize for clarity and maintainability over cleverness.
5. Avoid unnecessary coupling between layers.
6. Prefer explicit and predictable behavior.
7. Always consider downstream impact of changes.

---

## System Architecture

This is a client-server architecture:

- Frontend (React):
  - handles UI, state, and user interactions
  - communicates exclusively via API
  - must not embed business logic that belongs to the backend

- Backend (Django REST):
  - owns business logic and data integrity
  - exposes REST endpoints
  - enforces validation, permissions, and constraints

- Docs:
  - serves as the source of truth for architecture and decisions
  - should be consulted before making structural changes

---

## Domain Model (Conceptual)

Core entities include:

- FeatureRequest
  - id
  - title
  - description
  - created_at

- Vote
  - user (or anonymous identifier)
  - feature_request
  - created_at

Key rules:

- A user can upvote a feature
- A user should not vote multiple times on the same feature
- Ranking is based on vote count
- Sorting must be deterministic and consistent

---

## Backend Guidelines (Django)

When working in `backend/`:

- Follow Django conventions and project structure
- Keep business logic in services or models, not views
- Use serializers for validation and transformation
- Ensure endpoints are:
  - predictable
  - well-structured
  - consistent

API expectations:

- clear naming
- RESTful design
- consistent response shape
- proper error handling

Avoid:

- leaking database structure directly to API
- duplicating logic across views
- mixing concerns (validation, persistence, business rules)

---

## Frontend Guidelines (React + TypeScript)

When working in `frontend/`:

- Follow existing component and folder patterns
- Keep components small and composable
- Separate:
  - UI components
  - state management
  - API interaction

Guidelines:

- Do not duplicate backend logic
- Treat API as the single source of truth
- Handle loading, error, and empty states properly
- Prefer explicit typing over `any`
- Avoid deeply nested state logic when simpler alternatives exist

---

## API Contract Discipline

The frontend and backend communicate strictly via API contracts.

When changing the API:

- identify all frontend consumers
- maintain backward compatibility when possible
- update frontend accordingly if breaking changes are necessary
- keep naming consistent and intuitive

---

## Cross-Layer Changes

If a change affects both frontend and backend:

1. Define or update the contract first
2. Implement backend changes
3. adapt frontend to the new contract
4. validate end-to-end behavior

Avoid partial changes that leave the system in an inconsistent state.

---

## Data Integrity and Validation

All critical validation must happen in the backend.

Frontend validation is only for UX.

Backend must enforce:

- required fields
- uniqueness constraints (e.g., one vote per user per feature)
- data consistency

---

## Ranking and Sorting

Feature requests must be ranked by popularity.

Requirements:

- ranking must be deterministic
- ties must be handled consistently
- avoid expensive queries when possible
- consider scalability if dataset grows

---

## Testing Expectations

Focus testing where it matters:

Backend:
- business rules
- API responses
- validation logic

Frontend:
- component behavior
- user flows
- API integration points

General:

- prioritize meaningful tests over coverage numbers
- do not rewrite tests unnecessarily
- keep tests close to the behavior they validate

---

## Performance Considerations

Be mindful of:

Backend:
- query efficiency
- N+1 queries
- unnecessary recomputation

Frontend:
- excessive re-renders
- large component trees
- unnecessary API calls

---

## Documentation (docs/)

The `docs/` folder is a key part of this repository.

It should contain:

- architecture decisions
- domain modeling
- tradeoffs
- system evolution notes

When making structural or important changes:

- update docs if needed
- align implementation with documented decisions

---

## CI/CD and Automation

Defined in `.github/`.

Do not:

- break pipelines
- change workflows without clear justification

Ensure changes do not break:

- build
- lint
- tests

---

## What Not to Do

- Do not mix frontend and backend concerns
- Do not introduce unnecessary complexity
- Do not refactor unrelated areas
- Do not duplicate logic across layers
- Do not introduce breaking changes silently
- Do not ignore existing patterns in the codebase

---

## Preferred Workflow

Before coding:

1. Identify affected layer (frontend, backend, or both)
2. Check existing patterns
3. Understand impact

During coding:

1. Keep scope small
2. Maintain consistency
3. Follow conventions

After coding:

1. Validate behavior
2. Check affected areas
3. Ensure system consistency

---

## Prompt Logging

Every user instruction received by Claude Code must be logged in `PROMPT_HISTORY.md` at the project root.

This is not optional. It is a mandatory operational requirement.

**Rules:**

- Log every prompt, without exception. Skipping any entry is prohibited.
- The file is append-only. Do not edit or remove existing entries.
- Use the exact format defined below. No variation permitted.
- Use `PROMPT_HISTORY.md` only. Do not use `prompts.txt` or any other file.
- Log the full prompt content. Do not truncate or summarize the prompt field.
- Append the entry before declaring work complete.

**Required format for each entry:**

```
## [YYYY-MM-DDTHH:MM:SSZ] – <short summary>

### Prompt
<full prompt content>

### Action Taken
<concise description of what was done>
```

Entries must appear in chronological order. Each timestamp is ISO 8601 UTC.

---

## If Uncertain

When unclear:

- inspect nearby code
- follow existing conventions
- prefer simpler solutions
- avoid assumptions about architecture

If multiple valid approaches exist, choose the one that:

- minimizes complexity
- aligns with current structure
- is easiest to maintain
