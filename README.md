# Feature Rank

A full-stack Feature Voting System built as a monorepo. Users can submit feature requests, browse existing ones, upvote features they care about, and view a ranked list sorted by popularity.

Built with strong attention to system design, scalability, maintainability, and user experience.

---

## Stack

| Layer | Technology |
|---|---|
| Backend framework | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Auth | JWT via djangorestframework-simplejwt |
| Frontend framework | React 18 + TypeScript (strict) |
| Build tool | Vite |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| HTTP client | Axios (centralized instance) |
| Forms | React Hook Form |

---

## Repository Structure

```
feature-rank/
├── backend/           Django REST API
├── frontend/          React + Vite + TypeScript application
├── docs/              Architecture decisions, domain rules, engineering standards
├── .claude/           Claude Code configuration (agents, rules, hooks, skills)
├── .github/           CI/CD workflows
├── docker-compose.yml PostgreSQL service for local development
├── Makefile           Development task runner
└── CLAUDE.md          Repository-wide instructions for AI-assisted development
```

---

## Prerequisites

- Python 3.12+
- Node 20+
- Docker (for running PostgreSQL locally)

---

## Setup

### 1. Start the database

```bash
make docker-up
```

This starts a PostgreSQL 16 instance on port 5432.

### 2. Set up the backend

```bash
cp .env.example .env
make install-backend
make backend-migrate
```

The backend reads configuration from `.env` via `python-decouple`. See `.env.example` for all required variables.

### 3. Set up the frontend

```bash
make install-frontend
```

Copy the frontend environment file if needed:

```bash
cp frontend/.env.example frontend/.env.local
```

---

## Running the Application

Run backend and frontend concurrently:

```bash
make dev
```

Or separately:

```bash
make dev-backend    # Django dev server on http://localhost:8000
make dev-frontend   # Vite dev server on http://localhost:5173
```

---

## Running Tests

```bash
make test             # Run all tests
make test-backend     # Django/pytest tests only
make test-frontend    # Vitest tests only
```

---

## Linting and Formatting

```bash
make lint             # Lint backend (ruff) and frontend (eslint)
make lint-backend     # Ruff lint check only
make lint-frontend    # ESLint check only
make format           # Auto-format backend with ruff
make format-backend   # Ruff format only
```

---

## Documentation

The `docs/` directory contains authoritative architectural and engineering references:

- `docs/architecture/` — System overview, backend and frontend architecture, API design
- `docs/domain/` — Domain rules (voting behavior, constraints)
- `docs/engineering/` — Backend and frontend implementation standards, API conventions, security posture
- `docs/decisions/` — Architectural decision records

Consult `docs/` before making structural changes. Implementation must remain aligned with documented decisions.

---

## Claude Code Configuration

The `.claude/` directory contains configuration for AI-assisted development:

- `.claude/rules/` — Layer-specific and repository-wide operating rules
- `.claude/agents/` — Specialized sub-agent definitions
- `.claude/skills/` — Reusable task patterns
- `.claude/hooks/` — Automation hooks

These are part of the repository and must not be modified without deliberate intent.
