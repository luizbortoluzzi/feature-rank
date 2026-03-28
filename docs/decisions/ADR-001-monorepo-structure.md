# ADR-001: Monorepo Structure

## Status

Accepted

## Context

Feature Rank consists of two independently deployable services: a Django REST API and a React SPA. The project also requires shared infrastructure configuration, documentation, CI/CD workflows, and tooling that span both services.

The fundamental organizational question was whether to house the frontend and backend in a single repository or in separate repositories with an independent release cycle for each.

Given that:
- both services are developed by the same team simultaneously
- the API contract is the primary integration boundary and changes to it require coordinated updates in both services
- shared tooling (Makefile, Docker Compose, `.env`, pre-commit hooks, CI) would need to reference both services regardless of structure
- the project is scoped as a focused product, not a large organization with independently owned services

a monorepo was the practical choice.

## Decision

All code, configuration, documentation, and tooling for this project lives in a single repository. The repository is divided into clearly bounded top-level directories:

- `backend/` — the Django REST API, entirely self-contained with its own Dockerfile, `pyproject.toml`, and `manage.py`
- `frontend/` — the React SPA, self-contained with its own Dockerfile and `package.json`
- `docs/` — authoritative technical reference, consulted before implementation decisions
- `docker/` — container support files (Nginx config, MySQL init scripts) used by both services
- `.github/workflows/` — CI/CD pipeline that validates both services on every push
- `Makefile` — unified task runner that abstracts workflows across both services

There is no shared code or shared build output between frontend and backend. The only dependency between them is the API contract, which is documented in `docs/`.

## Consequences

**Benefits:**
- Cross-layer changes (API contract updates that require frontend and backend changes) are atomic — a single commit or pull request covers both sides of the boundary
- The CI pipeline validates both services together, so no integration regression can merge silently
- Shared tooling (Makefile targets, Docker Compose, `.env` configuration, pre-commit hooks) is defined once and applies uniformly
- New contributors have a single clone to start working; no coordination across repositories to set up a local environment
- Documentation in `docs/` is colocated with the code it describes, making drift easier to detect

**Trade-offs:**
- As the project grows, a monorepo without tooling like Nx or Turborepo can result in full CI runs even when only one service changes; this is acceptable at the current scale
- Separate deployment of frontend and backend is still possible — each has its own Dockerfile — but release versioning is not decoupled

## Alternatives Considered

**Separate repositories (frontend + backend):** Would decouple release cycles and reduce CI scope per repository, but would require coordination across repositories for every API change. Shared tooling would need to be duplicated or extracted into a third repository. The overhead is not justified for a project of this scope.

**Separate repositories with a shared configuration repository:** Adds a third coordination point without meaningful benefit at this scale.

## Evidence

- `backend/` — self-contained Django app with its own `Dockerfile`, `pyproject.toml`, `entrypoint.sh`
- `frontend/` — self-contained React app with its own `Dockerfile`, `package.json`, `vite.config.ts`
- `docker-compose.yml` — single file orchestrating both services from the repository root
- `Makefile` — unified task runner with targets for both backend and frontend operations
- `.github/workflows/ci.yml` — single pipeline with four jobs: `structure`, `pre-commit`, `frontend-quality`, `backend-tests`
- `docs/` — architecture, domain, engineering, and decisions documentation shared across both layers
- `.pre-commit-config.yaml` — single hook configuration covering Python (Black, Ruff) and JavaScript (ESLint, TypeScript) tooling
