# ADR-009: GitHub Actions CI Pipeline Design

## Status

Accepted

## Context

The repository hosts a monorepo with two codebases (Django backend, React frontend) and a documentation layer. A CI pipeline was needed to prevent regressions from merging, enforce code quality standards automatically, and give contributors fast, actionable feedback.

The pipeline needed to balance:
- **Completeness:** catching type errors, lint violations, formatting drift, test failures, and structural regressions
- **Speed:** parallel execution where jobs are independent
- **Relevance:** each failure points to the specific layer and check that failed, rather than a single monolithic job failure
- **Practicality:** CI must not require a running MySQL server (expensive, slow) for the backend test suite

## Decision

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and on pull requests targeting `main`. It consists of four independent parallel jobs:

**1. `structure` — Repository structure validation**
Checks that required files and directories exist: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.env.example`, `.editorconfig`, `.gitignore`, `.pre-commit-config.yaml`, `Makefile`, and the `frontend/`, `backend/`, `docs/`, `.github/workflows/` directories. Also verifies that `.env.example` does not contain a real `SECRET_KEY` value. This job catches accidental deletion of project-critical files and guards against committing secrets to the example configuration.

**2. `pre-commit` — Pre-commit hooks**
Runs the pre-commit hook suite using the `pre-commit/action` GitHub Action on Python 3.12. Frontend-specific hooks (`frontend-lint`, `frontend-typecheck`) are skipped via `SKIP=` env var — those are covered more completely by the dedicated `frontend-quality` job.

**3. `frontend-quality` — Frontend quality gates**
On Node 20 with npm caching:
- `npm run type-check` — TypeScript compilation without emit; catches type errors
- `npm run lint` — ESLint
- `npm run format:check` — Prettier format verification
- `npm run test -- --run` — Vitest single-pass execution
- `npm run build` — production Vite build with `VITE_API_BASE_URL` set; verifies the app compiles to distributable assets

The production build step is included specifically to catch Vite/TypeScript configurations that pass type-check but fail to bundle.

**4. `backend-tests` — Backend quality and test suite**
On Python 3.12 with pip caching:
- Installs `libmysqlclient-dev` system dependency (required to compile `mysqlclient` even when tests run against SQLite)
- `ruff check .` — linting
- `ruff format --check .` — format verification
- `pytest --cov=apps --cov-report=term-missing --cov-fail-under=80` — full test suite with coverage enforcement

The test suite uses `config.settings.test`, which configures SQLite in-memory. No MySQL service container is required in CI, which significantly reduces job startup time and eliminates infrastructure flakiness.

The 80% coverage threshold is enforced by `--cov-fail-under=80`. The CI job fails if coverage drops below this value.

## Consequences

**Benefits:**
- The four jobs run in parallel — total CI time is bounded by the slowest single job rather than the sum of all jobs
- Each job's failure is independently actionable: a frontend lint failure does not block the backend test result
- The test settings module swapping MySQL for SQLite means the backend test job requires no service container, runs faster, and has no infrastructure dependencies that could cause flaky failures
- The structure validation job catches a class of easily-overlooked problems (deleted config files, accidentally committed secrets) that no linter or test suite would catch
- The pre-commit job ensures hooks that developers run locally are also enforced in CI, closing the gap where a developer bypasses hooks

**Trade-offs:**
- SQLite in-memory means the CI test suite does not validate MySQL-specific behavior (e.g., the exact `IntegrityError` format for concurrent unique constraint violations, MySQL's collation behavior). Integration tests against the real stack require running Docker Compose locally.
- The `libmysqlclient-dev` system dependency must be installed in CI even though MySQL is not used for tests — it is required to compile `mysqlclient` when installing the package dependencies.
- The 80% coverage threshold is a floor, not a target. The threshold prevents regressions but does not measure whether the right behaviors are being tested.
- Running all four jobs on every push (not just on PRs) means pushes to feature branches trigger CI even before review. This is intentional — developers get feedback on their branch without waiting for a PR.

## Alternatives Considered

**Single monolithic job:** All checks in sequence in one job. Simpler pipeline YAML, but a frontend lint failure blocks the backend test result from appearing. Slower: the total time is the sum of all steps.

**Matrix strategy:** A single job with a matrix of (backend, frontend) dimensions. More flexible for adding variants (e.g., multiple Node versions), but adds complexity without benefit at the current scale.

**MySQL service container in CI:** A service container running MySQL 8.4 in the backend test job. Provides full fidelity to the production database engine. Chosen against because it adds startup latency, can cause flaky failures due to MySQL readiness timing, and the majority of test value is captured by the SQLite run.

**Separate workflows per layer (backend.yml, frontend.yml):** Cleaner separation, but creates two pipeline files with duplicated trigger configuration. The job-based separation within a single workflow file achieves the same independence.

## Evidence

- `.github/workflows/ci.yml` — four parallel jobs with no `needs:` dependency between them
- `.github/workflows/ci.yml` — `SKIP: frontend-lint,frontend-typecheck` in the pre-commit job
- `.github/workflows/ci.yml` — backend test job uses `pytest --cov=apps --cov-fail-under=80`; no MySQL service container
- `.github/workflows/ci.yml` — frontend quality job runs `npm run build` with `VITE_API_BASE_URL` env var set
- `backend/pyproject.toml` — `[tool.pytest.ini_options]` sets `DJANGO_SETTINGS_MODULE = "config.settings.test"`
- `backend/config/settings/test.py` — SQLite in-memory override, MD5 password hasher
- `.pre-commit-config.yaml` — hook definitions that the pre-commit CI job enforces
