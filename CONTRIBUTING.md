# Contributing

Thank you for your interest in contributing to feature-rank.

This document covers how to set up the project, how to contribute code, and what standards apply.

---

## Before You Start

Read the documentation. This project is specification-driven.

The `docs/` directory is the authoritative reference for all architectural and engineering decisions. Before writing any code, read the documents relevant to your change:

- `docs/architecture/system-overview.md` — domain model and system invariants
- `docs/architecture/backend-architecture.md` — backend layer structure and responsibilities
- `docs/architecture/frontend-architecture.md` — frontend structure and prohibited patterns
- `docs/domain/voting-rules.md` — voting behavior and domain rules
- `docs/engineering/backend/api-conventions.md` — API contract standard
- `docs/engineering/backend/security.md` — security requirements

Contributions that contradict documented constraints will not be merged without prior discussion.

---

## Project Structure

```
feature-rank/
├── backend/           Django REST API
│   ├── apps/          Domain apps (users, roles, categories, statuses, feature_requests)
│   └── config/        Settings, URLs, WSGI/ASGI
├── frontend/          React + TypeScript application
│   └── src/
│       ├── app/       Router, AuthProvider, ProtectedRoute
│       ├── pages/     Route-level components
│       ├── components/ Reusable presentational components
│       ├── features/  Domain-specific feature groupings
│       ├── hooks/     Shared hooks
│       ├── services/  API layer (all HTTP calls)
│       ├── types/     TypeScript types
│       └── utils/     Pure utility functions
├── docs/              Architecture and engineering documentation
└── .claude/           Claude Code configuration (agents, rules, hooks, skills)
```

---

## Local Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker (for running Postgres locally)

### 1. Start the database

```bash
make docker-up
```

### 2. Set up the backend

```bash
cp .env.example .env
# Edit .env and fill in DJANGO_SECRET_KEY and DATABASE_URL
make install-backend
make backend-migrate
```

### 3. Set up the frontend

```bash
make install-frontend
```

### 4. Run the application

```bash
make dev-backend    # starts Django on http://localhost:8000
make dev-frontend   # starts Vite on http://localhost:5173
# or both together:
make dev
```

---

## Running Tests

```bash
make test-backend    # runs pytest
make test-frontend   # runs vitest
make test            # runs both
```

---

## Linting and Formatting

```bash
make lint-backend    # ruff check
make lint-frontend   # eslint
make lint            # both

make format-backend  # ruff format
make format          # all
```

All code must pass lint checks before submission. CI enforces this.

---

## Coding Standards

### General

- Every change must be the smallest correct change that achieves the stated goal.
- Do not refactor unrelated code during a scoped task.
- Follow existing patterns. Check the codebase before inventing new ones.
- Keep changes consistent with what the docs describe.

### Backend

The backend follows a strict layered architecture:

| Layer | Responsibility |
|---|---|
| Views | HTTP concerns only: auth, permissions, serializer invocation, response formatting |
| Services | Non-trivial mutation workflows (vote, create, status change) |
| Selectors | Complex read logic and annotated queries |
| Serializers | Input validation and output shaping |
| Models | Fields, relationships, database constraints |
| Permissions | Named, explicit access control classes |

Rules:
- Business logic belongs in services, not views.
- `vote_count` is computed via annotation. It is never stored on `FeatureRequest`.
- `author_id` is always derived from the authenticated session. It is never client-supplied.
- `rate` must never appear in any `ORDER BY` expression.
- The default feature list ordering is `vote_count DESC, created_at DESC, id DESC`. This is non-negotiable.
- Vote uniqueness requires both a service-layer check and a database unique constraint.

### Frontend

The frontend is an API consumer. It does not implement domain logic.

Rules:
- All HTTP calls are in `services/`. No exceptions.
- Server state lives in TanStack Query. It is never copied into `useState` or Context.
- `has_voted` and `vote_count` come from the API. They are not derived locally (except the permitted optimistic update).
- The feature list is rendered in API response order. `Array.sort()` is never applied.
- Every async-dependent component handles loading, error, and empty states.
- TypeScript strict mode is active. `any` is prohibited.
- All API types use `snake_case` field names matching the API contract.

For full details, see `docs/architecture/frontend-architecture.md` and `docs/engineering/frontend/`.

---

## Claude Code Agents and Rules

This repository includes Claude Code configuration in `.claude/`:

- `.claude/agents/` — role-specific agent specifications (architect, backend-engineer, frontend-engineer, reviewer)
- `.claude/rules/` — mandatory behavioral rules (repo-rules, backend-rules, frontend-rules)
- `.claude/hooks/` — pre- and post-implementation checklists
- `.claude/skills/` — reusable task-specific skills

If you are contributing using Claude Code, these files govern agent behavior. Do not bypass them.

---

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name (`feature/vote-endpoint`, `fix/ranking-order`, `docs/data-modeling-update`).

2. **Write tests** for any non-trivial behavior you add or change. Business rules, permissions, and domain invariants must always have test coverage.

3. **Run the full check suite** before opening a PR:
   ```bash
   make lint
   make test
   ```

4. **Open a pull request** against `main`. The PR description must include:
   - What changed and why
   - Which layer(s) are affected
   - Which documents were consulted
   - What tests were added

5. **Address review feedback.** PRs will not be merged with unresolved comments.

6. **Keep PRs focused.** One concern per PR. Mixing unrelated changes slows review and makes history harder to read.

---

## Commit Messages

Use clear, imperative-mood commit messages:

```
Add vote uniqueness database constraint
Fix ranking order to include id DESC tie-breaker
Update api-conventions.md with unvote response shape
```

Avoid:
- Vague messages (`fix stuff`, `update`, `wip`)
- Messages that describe what changed rather than why

---

## Issues and Discussions

- **Bugs:** Open an issue with steps to reproduce, expected behavior, and actual behavior.
- **Feature requests:** Open an issue with a description of the use case and why existing behavior is insufficient.
- **Questions about architecture or design:** Open a discussion or reference the relevant doc in your issue.

---

## Changelog

All notable changes are tracked in `CHANGELOG.md`. If your contribution is user-visible (new feature, bug fix, breaking change), add an entry under `[Unreleased]` in the appropriate section.
