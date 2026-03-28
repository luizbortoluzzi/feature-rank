<div align="center">
  <img src="frontend/public/favicon/favicon.svg" alt="Feature Rank icon" width="80" />
  <br />
  <img src="frontend/public/logo.svg" alt="Feature Rank logo" width="420" />
</div>

# Feature Rank

A full-stack Feature Voting System built as a monorepo, designed to replace scattered feedback channels with a structured, vote-weighted ranking surface. Users submit feature requests, upvote what matters to them, and the system surfaces the most wanted work through a deterministic ranking algorithm.

Built as a technical challenge submission with production-grade attention to system design, domain integrity, security, and maintainability.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Demo Mode](#demo-mode)
- [Database Setup](#database-setup)
- [Available Commands](#available-commands)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [CI/CD](#cicd)
- [Documentation](#documentation)
- [Engineering Decisions](#engineering-decisions)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)

---

## Overview

Feature Rank is a structured product feedback platform. Teams can use it to collect, organize, and prioritize feature requests from their users. Every authenticated user can submit requests and vote on existing ones. The feature list is ranked by vote count in real time, with deterministic tie-breaking to ensure a stable, consistent order.

The backend enforces all domain invariants — vote uniqueness, author identity, status transitions — independently of client behavior. The frontend is a pure API consumer: it renders what the API returns and delegates all domain decisions to the backend.

---

## Features

- **Feature request submission** — authenticated users can create requests with a title, description, category, and a personal importance rating (1–5)
- **Upvoting** — one vote per user per feature; idempotent; casting a duplicate vote returns a success response without error
- **Ranked list** — features are sorted by vote count descending, with created date and ID as deterministic tie-breakers; client-side sorting is explicitly prohibited
- **Status lifecycle** — requests progress through a controlled state machine (open → planned → in progress → completed / rejected), managed exclusively by admins
- **Category system** — requests are classified by a controlled set of categories (UI, Performance, API, Security, Developer Experience, Other)
- **JWT authentication** — short-lived access tokens (15 min) with rotating refresh tokens (7 days) and a token blacklist
- **Admin operations** — status management, category and status CRUD, and moderation are protected by explicit admin-only permissions
- **Demo dataset** — a management command generates 20 realistic users, 60 feature requests, and a realistic vote distribution for demonstrating the system

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 (strict) | Type safety |
| Vite | 5 | Dev server and production bundler |
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state management and caching |
| Axios | 1.6 | HTTP client (centralized instance) |
| React Hook Form | 7 | Form state and validation |
| Mantine | 8 | Component library and design system |
| Tabler Icons | 3 | Icon set |
| Vitest + Testing Library | 1 | Unit and component testing |

### Backend

| Technology | Version | Role |
|---|---|---|
| Python | 3.13 | Runtime |
| Django | 5 | Web framework |
| Django REST Framework | 3 | REST API layer |
| djangorestframework-simplejwt | — | JWT authentication with blacklist support |
| dj-database-url | — | Database URL parsing |
| django-cors-headers | — | CORS management |
| WhiteNoise | — | Static file serving in production |
| Gunicorn | — | WSGI server for production |

### Database

| Technology | Version | Role |
|---|---|---|
| MySQL | 8.4 | Primary database |

### Infrastructure / DevOps

| Technology | Role |
|---|---|
| Docker | Container runtime |
| Docker Compose | Multi-service orchestration for development and production |
| Nginx | Production reverse proxy and static asset server |
| GitHub Actions | CI/CD pipeline |

### Tooling / Developer Experience

| Tool | Role |
|---|---|
| Make | Task runner (40+ targets for common workflows) |
| Black | Python code formatter |
| Ruff | Python linter and import sorter |
| ESLint | Frontend linter |
| Prettier | Frontend formatter |
| pre-commit | Git hook runner for automated code quality checks |

---

## Architecture

### Monorepo Organization

The repository contains two deployable services — a Django REST API and a React SPA — alongside shared documentation, infrastructure configuration, and CI/CD workflows. Each service has its own Dockerfile and can be built and deployed independently. A shared `docker-compose.yml` brings them together locally.

### Backend Layer Boundaries

The Django backend follows a strict four-layer architecture. Responsibilities are not permitted to leak across layers:

| Layer | Location | Responsibility |
|---|---|---|
| Views | `apps/*/views.py` | HTTP parsing, authentication entry point, permission checks, serializer invocation, status codes |
| Services | `apps/*/services.py` | Non-trivial mutation workflows: vote logic, status transitions, cascade operations |
| Selectors | `apps/*/selectors.py` | Read-only querysets with annotations (`vote_count`, `has_voted`), filtering, and ordering |
| Serializers | `apps/*/serializers.py` | Input validation and output representation; separate read/write serializers where needed |
| Models | `apps/*/models.py` | Field definitions, relationships, and database constraints |

Views are deliberately thin. Any logic beyond serializer invocation and response formatting belongs in a service or selector.

### Frontend Data Flow

The frontend follows a strict, unidirectional data-fetching chain:

```
Component → Custom hook → Service function → Axios instance → Backend API
```

No component or utility function calls HTTP directly. Server state is owned exclusively by TanStack Query. The frontend never derives domain state locally — `vote_count`, `has_voted`, and ranking order all come from the API response and are rendered as-is.

### Communication

The frontend proxies all `/api` requests to the backend during development. In production, nginx serves the compiled SPA and the backend is accessible at a configured API URL. There is no shared code or module between frontend and backend; the API contract is the only boundary.

### API Response Envelope

All backend responses follow a consistent envelope:

```json
// Success
{ "data": { ... }, "meta": null }

// Paginated success
{ "data": [ ... ], "meta": { "page": 1, "page_size": 20, "total_count": 100, "total_pages": 5 } }

// Error
{ "data": null, "meta": { "error": { "code": "...", "message": "...", "details": { ... } } } }
```

### Containerization

Development runs three containers coordinated by `docker-compose.yml`:

- **MySQL 8.4** — with a healthcheck that the backend depends on before starting
- **Django** — with source code bind-mounted for hot reload
- **Vite dev server** — with source code bind-mounted for HMR

Production swaps the Vite container for an nginx container serving the compiled static assets, and replaces `runserver` with Gunicorn (4 workers). The backend container drops its bind mount — it runs from the image content only.

---

## Project Structure

```
feature-rank/
├── backend/
│   ├── apps/
│   │   ├── categories/          # Reference data — category management
│   │   ├── feature_requests/    # Core domain — feature CRUD, voting, ranking
│   │   │   └── management/
│   │   │       └── commands/    # seed_reference_data, seed_demo_data
│   │   ├── roles/               # Reference data — user role definitions
│   │   ├── statuses/            # Reference data — status lifecycle management
│   │   └── users/               # Authentication and user profile
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Shared settings (JWT, DRF defaults, installed apps)
│   │   │   ├── development.py   # Debug on, CORS allow all, SQL logging
│   │   │   ├── production.py    # Security headers, WhiteNoise, gunicorn-ready
│   │   │   └── test.py          # SQLite in-memory, fast password hasher
│   │   └── urls.py              # Root URL configuration
│   ├── Dockerfile               # Multi-stage: builder (venv) + runtime (slim)
│   ├── entrypoint.sh            # DB readiness wait + migration runner
│   └── pyproject.toml           # Dependencies, Black, Ruff, pytest configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable presentational components
│   │   ├── features/            # Domain-specific component/hook groupings
│   │   ├── hooks/               # Shared, non-feature-specific hooks
│   │   ├── pages/               # Route-level components
│   │   ├── services/            # HTTP service functions (Axios calls only here)
│   │   ├── types/               # Shared TypeScript types
│   │   └── utils/               # Pure utility functions
│   ├── Dockerfile               # 4-stage: deps, builder, runner (nginx), dev (Vite)
│   ├── package.json             # Dependencies and npm scripts
│   ├── vite.config.ts           # Dev proxy, path aliases, Vitest configuration
│   └── tsconfig.json            # Strict mode, path aliases
├── docs/
│   ├── architecture/            # System overview, backend/frontend architecture, API design
│   ├── decisions/               # Architectural Decision Records (ADRs)
│   ├── domain/                  # Feature voting rules, invariants, lifecycle
│   └── engineering/             # Backend and frontend implementation standards
├── docker/
│   ├── mysql/                   # DB initialization scripts (test database grants)
│   └── nginx/                   # nginx.conf and default.conf for production
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions: structure, pre-commit, frontend, backend
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment variable reference template
├── Makefile                     # Task runner (setup, docker, dev, test, lint, seed)
└── .pre-commit-config.yaml      # Git hooks: Black, Ruff, ESLint, TypeScript check
```

---

## Prerequisites

The following tools must be available on your machine to run this project locally:

| Tool | Minimum Version | Notes |
|---|---|---|
| Docker | 24+ | Required for the database and containerized services |
| Docker Compose | v2 (plugin) | Bundled with Docker Desktop; standalone v2 also works |
| Make | Any | Pre-installed on macOS and most Linux distributions |
| Python | 3.13 | Only required if running the backend outside Docker |
| Node.js | 22 | Only required if running the frontend outside Docker |
| npm | 10+ | Bundled with Node.js 22 |

For the fully containerized workflow (recommended), only Docker and Make are required.

---

## Environment Variables

Copy the example file and fill in the required values before starting the application:

```bash
cp .env.example .env
```

The `.env` file is read by Docker Compose to configure all services. The following variables are required:

### Database

| Variable | Example | Description |
|---|---|---|
| `MYSQL_DATABASE` | `feature_rank` | Name of the application database |
| `MYSQL_USER` | `feature_rank_user` | Database user for the application |
| `MYSQL_PASSWORD` | *(set a strong value)* | Password for the database user |
| `MYSQL_ROOT_PASSWORD` | *(set a strong value)* | MySQL root password, used by healthchecks |

### Backend

| Variable | Example | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(generate with Django utility)* | Cryptographic secret key |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,backend` | Comma-separated list of allowed hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Allowed CORS origins for the frontend |

To generate a secure `DJANGO_SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Frontend

| Variable | Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the backend API, used by Axios |

The frontend Vite dev server also proxies `/api` requests to `http://localhost:8000` directly, so `VITE_API_BASE_URL` is primarily used for the production build.

---

## Running the Application

### Development Mode

Development mode runs all three services (MySQL, Django, Vite) with source code bind-mounted into the containers, enabling hot reload on both backend and frontend without a rebuild step.

**Step 1 — Configure environment**

```bash
cp .env.example .env
# Edit .env and fill in MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, and DJANGO_SECRET_KEY
```

**Step 2 — Start the database**

```bash
make up
```

This starts MySQL, waits for it to be healthy, then starts the backend (which auto-runs migrations via `entrypoint.sh`) and the frontend.

**Step 3 — Seed reference data**

On first run, the database needs categories, statuses, and roles created:

```bash
make seed
```

This runs the `seed_reference_data` management command, which is idempotent — safe to run multiple times.

**Step 4 — Access the application**

| Service | URL |
|---|---|
| Frontend (Vite HMR) | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |

The seed command creates two development accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin1234` |
| User | `user@example.com` | `user1234` |

---

### Demo Mode

Demo mode starts the application in the same development configuration but additionally loads a realistic dataset: 20 users, 60 feature requests across all categories and statuses, and a realistic vote distribution spanning 12 months of simulated activity.

**Run all setup steps from Development Mode first**, then add:

```bash
make seed-demo
```

This runs the `seed_demo_data` management command on top of the reference data. The command is additive — running it multiple times creates duplicate records, so run it once per environment.

**The difference between modes:** Development mode starts with only reference data (categories, statuses, roles) and two accounts — the minimal state needed to use the application. Demo mode adds a populated dataset that demonstrates the ranking, filtering, and status lifecycle features with realistic content.

---

## Database Setup

### Migrations

Migrations run automatically when the backend container starts (via `entrypoint.sh` in development). To run them manually:

```bash
make migrate
```

To generate migrations after model changes:

```bash
make makemigrations
```

### Seed Data

Two management commands handle data initialization:

**`seed_reference_data`** — Idempotent. Creates roles, categories, statuses, and development user accounts. This must be run before the application is usable.

```bash
make seed
```

**`seed_demo_data`** — Additive. Creates 20 demo users and 60 feature requests with vote history. Intended for demonstration and portfolio review.

```bash
make seed-demo
```

### Test Database

The CI pipeline and local test runner use SQLite in-memory (`config.settings.test`), so no database service is required to run tests. The MySQL init script at `docker/mysql/01-grant-test-db.sh` creates a separate `feature_rank_test` database for integration test scenarios that require a real MySQL engine.

---

## Available Commands

All common tasks are available through the `Makefile`. Run `make` or `make help` to see a list of targets.

### Docker

| Command | Description |
|---|---|
| `make up` | Start all services in detached mode |
| `make down` | Stop all services |
| `make logs` | Tail logs from all services |
| `make restart` | Restart all services |
| `make ps` | Show running service status |

### Development

| Command | Description |
|---|---|
| `make dev` | Run backend and frontend concurrently (outside Docker) |
| `make dev-backend` | Run Django dev server on `0.0.0.0:8000` |
| `make dev-frontend` | Run Vite dev server on `0.0.0.0:5173` |

### Database

| Command | Description |
|---|---|
| `make migrate` | Apply pending migrations (via Docker exec) |
| `make makemigrations` | Generate new migration files |
| `make seed` | Load reference data (roles, categories, statuses, dev users) |
| `make seed-demo` | Load demo dataset (20 users, 60 features, realistic votes) |
| `make shell` | Open a Django shell inside the backend container |

### Testing

| Command | Description |
|---|---|
| `make test` | Run all tests (backend + frontend) |
| `make test-backend` | Run pytest with 80% coverage enforcement |
| `make test-frontend` | Run Vitest in single-run (CI) mode |

### Code Quality

| Command | Description |
|---|---|
| `make lint` | Run Ruff (backend) and ESLint (frontend) |
| `make lint-backend` | Run `ruff check .` |
| `make lint-frontend` | Run `eslint src/` |
| `make format` | Format backend with Black and Ruff |
| `make format-backend` | Run `black` then `ruff format` |
| `make fix` | Auto-fix lint issues in backend and frontend |
| `make pre-commit-install` | Install pre-commit hooks into `.git/hooks` |
| `make pre-commit-run` | Run all pre-commit hooks against all files |

### Dependency Installation

| Command | Description |
|---|---|
| `make install` | Install all dependencies (backend + frontend) |
| `make install-backend` | `pip install -e ".[dev]"` |
| `make install-frontend` | `npm install` |

---

## Testing

### Backend

Tests use pytest with the Django plugin. The test configuration (`config.settings.test`) swaps MySQL for an in-memory SQLite database and uses MD5 password hashing to speed up test execution.

```bash
make test-backend
```

Coverage is enforced at **80% minimum** — the CI pipeline fails below this threshold.

Test coverage priorities:
- Business rules and domain invariants (vote uniqueness, ranking order, status transitions)
- Permission enforcement (object ownership, admin-only operations)
- API contract compliance (response shape, HTTP status codes, error structure)
- Negative paths (duplicate votes, unauthorized access, invalid payloads, protected field overrides)

### Frontend

Tests use Vitest with jsdom and React Testing Library.

```bash
make test-frontend
```

The `test` npm script runs Vitest in watch mode by default. The Makefile target passes `--run` for a single-pass CI execution.

---

## Code Quality

### Backend

Python code style is enforced with **Black** (formatter) and **Ruff** (linter). Both are configured in `pyproject.toml` with a line length of 100 and Python 3.12 as the target version.

Ruff enforces the following rule sets: `E` (pycodestyle errors), `F` (pyflakes), `W` (warnings), `I` (isort), `UP` (pyupgrade), `B` (bugbear), `C4` (comprehensions).

### Frontend

Frontend code quality uses **ESLint** for linting and **Prettier** for formatting. TypeScript strict mode is active; `any` is prohibited except at explicitly justified adapter boundaries. All components must have typed props interfaces.

### Pre-commit Hooks

The `.pre-commit-config.yaml` registers hooks that run on every commit:

- `end-of-file-fixer` and `trailing-whitespace` — universal file hygiene
- `check-yaml` — YAML syntax validation
- `black` — Python formatting
- `ruff` — Python linting and format check
- `eslint` — Frontend linting
- TypeScript check — Frontend type validation

Install the hooks after cloning:

```bash
make pre-commit-install
```

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs four parallel jobs on every push and pull request:

### 1. Repository Structure Validation

Verifies that required files and directories exist: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.env.example`, `.editorconfig`, `.gitignore`, `.pre-commit-config.yaml`, `Makefile`, and the `frontend/`, `backend/`, `docs/`, and `.github/workflows/` directories. Also checks that `.env.example` does not contain real secret values.

### 2. Pre-commit Hooks

Runs Black and Ruff against the backend on Python 3.12. Frontend hooks (ESLint, TypeScript) are covered by the dedicated frontend job.

### 3. Frontend Quality

On Node 20, with npm caching:
- `npm run type-check` — TypeScript compilation without emit
- `npm run lint` — ESLint
- `npm run format:check` — Prettier format verification
- `npm run test -- --run` — Vitest single-pass
- `npm run build` — Production build verification

### 4. Backend Tests

On Python 3.12:
- `ruff check .` — linting
- `ruff format --check .` — format verification
- `pytest --cov=apps --cov-fail-under=80` — full test suite with 80% coverage gate

All four jobs must pass before a pull request can be merged.

---

## Documentation

The `docs/` directory is the authoritative source of truth for this project. It is not supplementary reading — implementation decisions are expected to align with it, and conflicts must be surfaced explicitly.

### Contents

| Directory | Contents |
|---|---|
| `docs/architecture/` | System overview, backend and frontend architecture, API design patterns |
| `docs/domain/` | Feature voting rules, ranking invariants, status lifecycle, domain constraints |
| `docs/engineering/backend/` | API conventions, data modeling rules, Django standards, security posture |
| `docs/engineering/frontend/` | API consumption patterns, React standards, state management, UI/UX guidelines |
| `docs/engineering/general/` | Cross-cutting coding standards and testing strategy |
| `docs/decisions/` | Architectural Decision Records (ADRs) |

### Key Documents

- **`docs/architecture/system-overview.md`** — core domain model, actors, and system invariants
- **`docs/domain/voting-rules.md`** — the authoritative specification for all voting behavior, including concurrency handling
- **`docs/engineering/backend/api-conventions.md`** — response envelope, pagination, sorting, and error format
- **`docs/decisions/ADR-001-monorepo-structure.md`** — rationale for the monorepo layout
- **`docs/decisions/ADR-002-voting-model.md`** — why equal-weight voting over weighted alternatives

---

## Engineering Decisions

### Vote Uniqueness via Dual-Layer Enforcement

Vote uniqueness is enforced at two independent layers. The service layer uses `get_or_create` to avoid duplicate inserts in the common case. The database layer has a `UNIQUE` constraint on `(user_id, feature_request_id)`. In concurrent scenarios where two requests race past the service check simultaneously, the second insert triggers an `IntegrityError`, which is caught and returned as `200 OK` — treating the operation as an idempotent success rather than an error.

### Deterministic Ranking Without Client Sorting

The feature list ordering is fixed as `vote_count DESC → created_at DESC → id DESC`. This triple-key sort guarantees a stable, fully deterministic order regardless of dataset size or tie distribution. The `id` tertiary key means no two rows can ever occupy the same position. Client-side sorting is explicitly forbidden at the architecture level — the frontend renders the API order exactly.

### `rate` Is Not a Ranking Signal

The `rate` field (1–5, set by the feature author) represents personal importance assessment. It is never included in any `ORDER BY` expression. Ranking is based exclusively on aggregate vote count, which reflects community interest rather than author priority. This distinction is documented as a domain invariant and enforced in both the selector logic and the backend rules.

### JWT with Refresh Token Rotation

Access tokens have a 15-minute lifetime. Refresh tokens last 7 days and rotate on every use — each refresh issues a new refresh token and blacklists the previous one. This limits the blast radius of a stolen refresh token to a single use window.

### Separation of Read and Write Serializers

Feature requests use distinct serializers for reads and writes. The read serializer exposes nested representations of author, category, and status with their display-relevant fields. The write serializer handles input validation and explicitly strips `author_id`, `vote_count`, and `status_id` (for non-admin users) to prevent client-controlled field injection.

### SQLite for Tests, MySQL for Development

The test configuration uses an in-memory SQLite database to eliminate the need for a running MySQL service during local test runs and in CI. Database-constraint-sensitive tests (such as vote uniqueness under concurrency) are explicitly noted as requiring the real MySQL engine for complete validation.

### Four-Stage Frontend Dockerfile

The frontend Dockerfile separates dependency installation, production build, nginx serving, and development serving into four discrete stages. The dev target mounts source code at runtime and runs `vite --host 0.0.0.0` for HMR. The runner target is a static nginx container that serves the compiled `dist/` output with long-lived caching headers safe for Vite's content-hashed asset filenames.

---

## Future Improvements

The following areas represent natural next steps for evolving this system toward production at scale:

- **Soft delete for users** — the current model marks users inactive via `is_active=False` but does not fully handle downstream effects (e.g., vote counts from deactivated users, attribution on deleted accounts)
- **Pagination cursor support** — offset-based pagination degrades on large datasets; cursor-based pagination would be more appropriate for the ranked feature list
- **Rate limiting** — the architecture documents note that high-value endpoints (login, token refresh, voting, feature creation) should be rate-limited; this is not yet implemented at the application layer
- **Full-text search** — the current search filter is a basic `icontains` match on title; integrating MySQL full-text search or a dedicated search index would improve relevance on larger datasets
- **Notification system** — authors could be notified when their feature reaches a vote threshold or when its status changes
- **Webhook or event emission** — status change events could be emitted to external systems (e.g., project management tools) to reduce manual cross-tool synchronization
- **Admin dashboard** — a dedicated admin interface for bulk moderation, status management, and analytics beyond what the standard Django admin provides
- **Audit log** — status transitions and admin actions currently leave no explicit audit trail; an append-only event log would support compliance and debugging
- **Vote analytics** — vote velocity and time-series data would provide richer signal for prioritization than cumulative count alone
- **Production observability** — structured logging, distributed tracing, and metrics collection are not yet configured; these are required before running at any meaningful scale

---

## Contributing

1. Fork the repository and create a branch from `main`
2. Install pre-commit hooks: `make pre-commit-install`
3. Make your changes, keeping scope small and consistent with existing patterns
4. Ensure all checks pass: `make lint && make test`
5. Verify the production build succeeds: `cd frontend && npm run build`
6. Open a pull request with a clear description of the change and its motivation

Before making structural changes, read the relevant documentation in `docs/` — the architecture documents define constraints that must be preserved. If your change conflicts with documented behavior, surface the conflict explicitly in your pull request description.

All pull requests must pass the full CI pipeline before review.
