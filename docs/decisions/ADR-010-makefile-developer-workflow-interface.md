# ADR-010: Makefile as the Unified Developer Workflow Interface

## Status

Accepted

## Context

Feature Rank is a monorepo with a backend (Django/Python), a frontend (React/TypeScript), and a Docker Compose infrastructure layer. Each layer has its own tooling commands:

- Backend: `python manage.py ...`, `pytest`, `ruff`, `black`, `pip install`
- Frontend: `npm run ...`, `npm install`, `npx ...`
- Infrastructure: `docker compose ...` with varying flags and arguments

Without a unifying interface, developers must remember tool-specific commands for each layer, often with different syntax, argument conventions, and working directory requirements. This slows onboarding and creates inconsistency between how developers run things locally versus how CI runs them.

The project needed a single entry point that abstracts the multi-layer complexity and provides a common vocabulary for all development tasks.

## Decision

A `Makefile` at the repository root serves as the unified developer workflow interface. All common development tasks are exposed as named targets that abstract the underlying tool invocations.

The Makefile is organized into categories: Setup, Docker, Development, Database, Code Quality, Testing, and Pre-commit. A `help` target (the default) prints all available targets with short descriptions.

Key design decisions in the Makefile:

**Docker operations delegate to `docker compose`:** `make up`, `make down`, `make logs`, `make ps` wrap `docker compose` with the appropriate flags. This means developers use `make up` rather than remembering whether the flag is `-d` or `--detach`.

**Database operations run inside the container:** `make migrate`, `make seed`, `make seed-demo`, and `make shell` use `docker compose exec` to run commands inside the running backend container. This ensures the correct settings module, database connection, and Python environment are used automatically.

**Concurrent development server startup:** `make dev` runs `$(MAKE) -j2 dev-backend dev-frontend`, starting both servers in parallel for developers who prefer running outside Docker.

**Code quality targets are consistent across layers:** `make lint` runs both `ruff check .` (backend) and `npm run lint` (frontend). `make test` runs both `pytest` and `npm run test -- --run`. This means a single command validates both layers.

**All targets are declared `.PHONY`:** Prevents Make from confusing target names with file names of the same name in the repository.

## Consequences

**Benefits:**
- New contributors have one command to discover (`make` or `make help`) and a consistent vocabulary for all tasks, regardless of which layer they are working in
- CI and local development use the same underlying commands — CI's `pytest --cov=apps --cov-fail-under=80` is the same as `make test-backend` run locally (modulo coverage flags exposed by `pyproject.toml`)
- Abstracting `docker compose exec` in database targets means running migrations never requires remembering container names, service names, or compose file paths
- The `make dev` parallel target eliminates the need to open multiple terminal windows when developing outside Docker

**Trade-offs:**
- Make is a build tool with an execution model designed for file dependency graphs, not arbitrary task runners. Using it purely as a task runner means none of Make's incremental build features are used, and the syntax (`.PHONY`, tab-indented recipes) can be surprising to developers unfamiliar with it
- The Makefile is not cross-platform in the strictest sense — it assumes a Unix shell (`/bin/sh`). Windows developers need WSL2 or Git Bash. This is consistent with the overall Docker-on-WSL2 development path documented for the project.
- Make targets are not composable in the way that shell pipelines or npm scripts are. Adding conditional logic requires either additional variables or separate targets.

## Alternatives Considered

**npm scripts as the unified interface:** npm scripts could wrap both frontend and backend commands via `cross-env` and shell execution. However, this requires Node to be installed even for backend-only tasks and makes it less clear which layer a script belongs to.

**`just` (a modern task runner):** `just` has cleaner syntax than Make, is cross-platform, and is designed specifically as a command runner. It is not yet as universally available as Make, which is pre-installed on macOS and most Linux distributions. The developer friction of installing an additional tool was not worth the ergonomic improvement at this project's scale.

**Shell scripts:** A collection of `scripts/setup.sh`, `scripts/test.sh`, etc. Works but requires documentation of which script does what, lacks a built-in `help` target, and is harder to discover. Less conventional than a Makefile for repository root tooling.

**No unified interface (raw commands documented in README):** Documents all commands directly. Requires developers to copy-paste from documentation and remember tool-specific invocations. Does not survive across environments where commands need to be tweaked (e.g., running with `docker compose exec -T` for non-interactive CI).

## Evidence

- `Makefile` — full target listing with `help` output, `.PHONY` declarations, organized sections
- `Makefile` — `make up` → `docker compose up -d`; `make migrate` → `docker compose exec -T backend python manage.py migrate`; `make seed` → `docker compose exec -T backend python manage.py seed_reference_data`
- `Makefile` — `make dev` → `$(MAKE) -j2 dev-backend dev-frontend` (parallel execution)
- `Makefile` — `make lint` runs both `ruff check .` and `npm run lint`; `make test` runs both `pytest` and `npm run test -- --run`
- `.github/workflows/ci.yml` — CI jobs run the same underlying tools (ruff, pytest, npm run lint, etc.) that the Makefile wraps; the Makefile is not used directly in CI to keep CI jobs explicit and auditable
