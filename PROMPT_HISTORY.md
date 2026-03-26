# Prompt History

This file is the append-only log of every user instruction received by Claude Code in this repository.

**Format:** Each entry uses structured Markdown with a timestamp, prompt content, and action taken.
**Rule:** Do not edit or remove existing entries. Append only.

---

## [2026-03-26T00:00:00Z] – Rewrite backend documentation to production-grade

### Prompt
Rewrite and harden the following documentation files to production-grade level: `docs/engineering/backend/api-conventions.md`, `docs/domain/voting-rules.md`, `docs/engineering/backend/data-modeling.md`. All three must enforce hard constraints on voting behavior, ranking, data modeling, security, and API shape.

### Action Taken
Fully rewrote all three documents from soft, partially-optional stubs to strict, mandatory specifications. Fixed tie-breaker ordering logic, added `on_delete` directives for all FKs, added explicit field length constraints, added email normalization rules, clarified role access control (no API endpoint), added immutability rules for Vote, and enforced dual-layer vote uniqueness constraints.

---

## [2026-03-26T00:01:00Z] – Review documentation for contradictions and ambiguities

### Prompt
Review the three rewritten documents and find: contradictions, missing constraints, ambiguous wording, places where an engineer could misinterpret behavior. Be strict.

### Action Taken
Produced a structured review finding 32 issues across the three documents, classified as blocking, required, or advisory. Issues included circular response-shape references, missing timestamps on reference entities, conflicting enforcement hierarchy descriptions, contradictory Role access control rows, and missing semantic definitions.

---

## [2026-03-26T00:02:00Z] – Fix all 32 review issues in documentation

### Prompt
Do all the fixes.

### Action Taken
Applied all 32 fixes across `api-conventions.md`, `voting-rules.md`, and `data-modeling.md`. Key fixes: circular unvote sentence resolved, `created_at`/`updated_at` added to Role/Category/Status field tables, enforcement hierarchy contradiction resolved (service layer first, DB constraint as safety net), Role access control row changed to "No API endpoint", Vote marked immutable (no `updated_at`), User.name defined as display name.

---

## [2026-03-26T00:03:00Z] – Create structured voting-rules.md with 11 sections

### Prompt
Create the file `docs/domain/voting-rules.md` with 11 mandatory sections: Voting Model, Vote Constraints, Vote Lifecycle, Concurrency Rules, Ranking Rules, Vote Count Definition, Rate Interaction, Authorization Rules, API Behavior, System Invariants, Anti-Patterns.

### Action Taken
Created `docs/domain/voting-rules.md` with all 11 sections. Included 15 numbered system invariants, 9 named anti-patterns, full request/response shapes for vote/unvote endpoints, and explicit rules for terminal-status voting, deactivated-user vote retention, and re-voting after unvote.

---

## [2026-03-26T00:04:00Z] – Create state-management.md for frontend

### Prompt
Create the file `docs/engineering/frontend/state-management.md` with 12 mandatory sections covering state tiers, server state rules, local state rules, shared state, optimistic update procedure, loading state discipline, and anti-patterns. Aligned with `frontend-architecture.md`, `api-consumption.md`, and `feature-voting.md`.

### Action Taken
Created `docs/engineering/frontend/state-management.md` with all 12 sections. Defined three state tiers (TanStack Query, useState/useReducer, AuthContext only). Specified exact optimistic update procedure (snapshot → estimate → send → overwrite with VoteResponse → rollback on failure). Prohibited useState for loading state already tracked by TanStack Query. Listed 12 named anti-patterns.

---

## [2026-03-26T00:05:00Z] – Create four Claude Code agent files

### Prompt
Create the following agent files inside `.claude/agents/`: `architect.md`, `backend-engineer.md`, `frontend-engineer.md`, `reviewer.md`. These are strict, role-specific, doc-driven operational specifications, not generic descriptions.

### Action Taken
Created all four agent files. Each defines: purpose, scope, required documents to read before acting, a pre-action checklist, hard layer rules, deferral conditions, must-never-do list, and success criteria. The `reviewer.md` includes full backend and frontend review checklists (checkbox format), severity classification (Blocking/Required/Advisory), and a structured output format.

---

## [2026-03-26T00:06:00Z] – Create three Claude Code hook files

### Prompt
Create the following hook files inside `.claude/hooks/`: `pre-implementation.md`, `post-implementation.md`, `review-checklist.md`. These define mandatory operational behavior for Claude Code when working in this repository.

### Action Taken
Created all three hook files. `pre-implementation.md`: 4-step checklist (scope identification, documentation discovery per layer, constraint extraction, implementation planning). `post-implementation.md`: 5-step checklist (documentation alignment, architecture compliance per layer, quality/risk checks, testing completeness, final consistency check). `review-checklist.md`: 8-section checklist with Critical/Major/Minor severity levels, anti-pattern detection tables per layer, and structured report output format.

---

## [2026-03-26T00:07:00Z] – Set up initial monorepo structure

### Prompt
Set up the initial monorepo structure for this repository. Create the full executable scaffold including: root-level config files (`.editorconfig`, `.gitignore`, `.env.example`, `.pre-commit-config.yaml`, `Makefile`, `docker-compose.yml`, `README.md`), Django + DRF backend with domain apps, React + Vite + TypeScript frontend with full directory structure per architecture docs, and GitHub CI workflows.

### Action Taken
Created complete monorepo scaffold. Root: 7 config files including Makefile with full developer workflow targets, Postgres-only docker-compose. Backend: `pyproject.toml` with pinned deps (Django 5, DRF, JWT, psycopg3), split settings (base/development/production), custom User model with `is_admin`, 5 domain apps each with full module layout (models, serializers, views, services, selectors, permissions, urls, admin, tests, migrations), JWT endpoints wired at `/api/auth/token/`. Frontend: Vite + React 18 + TypeScript strict, TanStack Query v5, Axios instance with interceptors, React Router v6 with ProtectedRoute, AuthProvider, 5 service files, 6 type files all in `snake_case`, 5 feature directories with queryKeys, 5 page stubs. CI: `backend-ci.yml` (Postgres service, ruff, pytest), `frontend-ci.yml` (tsc, eslint, vite build).

---

## [2026-03-26T00:08:00Z] – Implement structured prompt logging with PROMPT_HISTORY.md

### Prompt
Update the repository to implement structured prompt logging using a Markdown file instead of a plain text file. Replace any existing or implicit "prompts.txt" logging behavior with a new standard based on `PROMPT_HISTORY.md`. Every user instruction must be logged as a structured Markdown entry with timestamp, prompt content, and action taken. Update `CLAUDE.md`, `.claude/rules/repo-rules.md`, and `.claude/hooks/post-implementation.md` to enforce this as a mandatory behavior.

### Action Taken
Created `PROMPT_HISTORY.md` with retroactive entries for all prior prompts in this session. Added "Prompt Logging" section to `CLAUDE.md` defining the format, file location, and mandatory nature of logging. Added Rule 9 "Prompt Logging" to `.claude/rules/repo-rules.md` forbidding skipped entries, alternative files, and non-structured formats. Added Step 6 "Prompt Logging" to `.claude/hooks/post-implementation.md` as a blocking post-implementation requirement.

---

## [2026-03-26T14:57:00Z] – Write all Docker configuration files for the monorepo

### Prompt
Write all Docker configuration files for the feature-rank monorepo at /home/isam/prj/feature-rank.

## Stack confirmed from codebase exploration:
- **Backend**: Django 5.0+ with DRF, JWT auth (djangorestframework-simplejwt), CORS. Entry points: `backend/config/wsgi.py`, `backend/config/settings/{base,development,production}.py`. Package manager: pyproject.toml with setuptools. Currently uses psycopg (PostgreSQL) — must be swapped for mysqlclient (MySQL). manage.py at backend root.
- **Frontend**: React 18 + TypeScript + Vite 5. package.json at frontend/. Scripts: `npm run dev`, `npm run build`. Dev server port: 5173.
- **Database**: Must be MySQL 8.4 (switching from the current PostgreSQL setup).
- **Image constraints**: python:3.13-slim, node:22-alpine, nginx:1.27-alpine — all pinned.

## IMPORTANT DEPENDENCY CHANGE
The existing `backend/pyproject.toml` has `psycopg[binary]` and no gunicorn. You must update it to:
1. Replace `psycopg[binary]>=3.1,<4.0` with `mysqlclient>=2.2,<3.0`
2. Add `gunicorn>=22.0,<23.0` to the main dependencies list

## Files to create/overwrite:

### 1. `backend/.dockerignore`
### 2. `frontend/.dockerignore`
### 3. `backend/Dockerfile` — multi-stage
### 4. `backend/entrypoint.sh`
### 5. `frontend/Dockerfile` — multi-stage
### 6. `docker/nginx/nginx.conf`
### 7. `docker/nginx/default.conf`
### 8. `docker/mysql/01-grant-test-db.sh`
### 9. `docker-compose.yml` — development
### 10. `docker-compose.prod.yml` — production override
### 11. `.env.example` — overwrite the existing one at repo root
### 12. Update `backend/pyproject.toml`

### Action Taken
Created all 12 Docker configuration artifacts. Replaced the existing PostgreSQL-based docker-compose.yml with a full MySQL 8.4 setup. Backend Dockerfile: two-stage build (python:3.13-slim builder with mysqlclient compile deps, python:3.13-slim runtime with libmysqlclient21 only, non-root appuser uid 1000). Frontend Dockerfile: four-stage build (deps, builder, runner/nginx:1.27-alpine, dev/node:22-alpine). entrypoint.sh: Python socket wait loop (60s timeout) + conditional migrate on DJANGO_ENV=development. docker-compose.yml: MySQL 8.4 with healthcheck, backend with DATABASE_URL + DB_HOST/DB_PORT env vars, frontend dev target with anonymous node_modules volume. docker-compose.prod.yml: gunicorn 4 workers, MySQL port unexposed, restart:always, nginx bind-mount for configs. docker/nginx/nginx.conf: gzip, server_tokens off, access log. docker/nginx/default.conf: SPA fallback, security headers, 1y asset cache, /healthz endpoint. docker/mysql/01-grant-test-db.sh: grants app user access to test_ database for Django test runner. .env.example: rewritten with MySQL variables, no DATABASE_URL (passed as composed URL in compose), no secrets. pyproject.toml: psycopg[binary] replaced with mysqlclient>=2.2,<3.0, gunicorn>=22.0,<23.0 added to main deps. Both shell scripts set executable (chmod +x).

---

## [2026-03-26T00:09:00Z] – Create repository governance and meta files

### Prompt
Create the following repository governance and meta files at the root of the project: `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `CHANGELOG.md`. These files must be professional, production-ready, and appropriate for a modern open-source or collaborative project. Do not generate placeholders or generic fluff. Each file must be complete, clear, and usable. Use MIT license. Base Code of Conduct on Contributor Covenant. SECURITY.md must define vulnerability reporting, response expectations, supported versions, and disclosure policy. CONTRIBUTING.md must cover project structure, local setup, coding standards, PR process, commit expectations, requirement to follow docs and use `.claude/` configuration. SUPPORT.md must cover question channels, bug reporting, support vs feature request distinction, and response model. CHANGELOG.md must follow Keep a Changelog format with an initial version entry.

### Action Taken
Created all 6 files. `LICENSE`: MIT, copyright 2026 feature-rank contributors. `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1 with expected/unacceptable behavior, 4-tier enforcement guidelines, and reporting instructions. `SECURITY.md`: Private reporting via GitHub security tab or email, 3-stage response timeline table, coordinated disclosure policy (max 90 days), in-scope/out-of-scope tables, and links to relevant security docs. `CONTRIBUTING.md`: Full setup instructions using Makefile targets, project structure overview, backend layer rules table, frontend rules summary, Claude Code agent/rules/hooks section, PR checklist, commit message guidelines, and changelog instructions. `SUPPORT.md`: Channels table (GitHub Discussions for questions, Issues for bugs), support-vs-feature-request table, best-effort response model. `CHANGELOG.md`: Keep a Changelog format, `[Unreleased]` section with full scaffold additions, `[0.1.0]` initial documentation release entry, comparison links (placeholder URLs marked).

---

## [2026-03-26T18:10:00Z] – Configure Django project layer

### Prompt
You are the backend-engineer agent for this Django monorepo at /home/isam/prj/feature-rank.

## What exists
- `backend/config/settings/{base,development,production}.py` — skeleton settings
- `backend/config/urls.py` — URL routing skeleton (apps wired, but apps have empty urls.py)
- `backend/apps/{users,roles,categories,statuses,feature_requests}/` — all scaffolded
  with empty models.py, views.py, serializers.py, services.py, selectors.py, urls.py
- `AUTH_USER_MODEL = "users.User"` is declared in base.py but the User model does not exist yet
- Database is MySQL 8.4 (switched from PostgreSQL); driver is mysqlclient

## Your task: configure the Django project layer — do NOT implement business models yet

Work strictly in this order. Read the relevant docs before each step.

---

### 1. Custom User model — apps/users/models.py

Read `docs/engineering/backend/data-modeling.md` and `docs/architecture/system-overview.md` first.

Create a minimal custom User model in `apps/users/models.py` that:
- Extends `AbstractUser`
- Adds an `is_admin` boolean field (default False) — used for permission checks
- Keeps email as the primary identifier if the docs say so; otherwise use username
- Has no other fields — domain fields (role FK, etc.) come later when models are implemented
- Generates the initial migration for users only (DO NOT apply it — just create the migration file)

This is a prerequisite for everything else — Django cannot start without it.

---

### 2. MySQL-specific database settings — config/settings/base.py

Add `OPTIONS` to the DATABASES default config:
```python
OPTIONS: {
    "charset": "utf8mb4",
    "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
}
```
These are required for proper Unicode support and strict mode enforcement with MySQL 8.

---

### 3. JWT settings — config/settings/base.py

Add a `SIMPLE_JWT` block. Read `docs/engineering/backend/security.md` for the
required token lifetime policy. At minimum configure:
- `ACCESS_TOKEN_LIFETIME` — short (e.g. 15 minutes or whatever the docs specify)
- `REFRESH_TOKEN_LIFETIME` — longer (e.g. 7 days)
- `ROTATE_REFRESH_TOKENS = True`
- `BLACKLIST_AFTER_ROTATION = False` (no blacklist app added)
- `AUTH_HEADER_TYPES = ("Bearer",)`
- `USER_ID_FIELD = "id"` and `USER_ID_CLAIM = "user_id"`

---

### 4. DRF custom exception handler — config/drf_exception_handler.py

The API contract (read `docs/engineering/backend/api-conventions.md`) requires all
error responses to follow this envelope:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```
And all success responses:
```json
{ "data": ..., "meta": null }
```

Create `backend/config/drf_exception_handler.py` with:
- A custom exception handler that wraps DRF exceptions into the error envelope
- Maps `ValidationError` → `400` with `details` populated from `exc.detail`
- Maps `AuthenticationFailed` / `NotAuthenticated` → `401`
- Maps `PermissionDenied` → `403`
- Maps `NotFound` → `404`
- All others → `500` with a generic message (no stack trace exposed)

Register it in `base.py`:
```python
REST_FRAMEWORK = {
    ...
    "EXCEPTION_HANDLER": "config.drf_exception_handler.custom_exception_handler",
}
```

Also create `backend/config/drf_renderer.py` with a custom renderer that wraps
all successful responses in `{ "data": ..., "meta": null }`. Register it as the
default renderer in REST_FRAMEWORK settings.

---

### 5. Production settings hardening — config/settings/production.py

Extend the production settings with:
- `SECURE_SSL_REDIRECT = False` (TLS is terminated at the load balancer/nginx level)
- `SESSION_COOKIE_SECURE = True`
- `CSRF_COOKIE_SECURE = True`
- `SECURE_HSTS_SECONDS = 31536000`
- `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`
- `CONN_MAX_AGE` already set via dj-database-url but verify it is 600
- Static files: add `whitenoise.middleware.WhiteNoiseMiddleware` to MIDDLEWARE
  (after SecurityMiddleware, before everything else) and set
  `STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"`
  Add `whitenoise>=6.6,<7.0` to `pyproject.toml` dependencies.

---

### 6. Structured logging — config/settings/base.py and development.py

In `base.py`, add a `LOGGING` dict that:
- Uses console handler only (no file handler)
- Formats as plain text
- Sets `django.request` logger to WARNING (avoids 4xx noise in prod)
- Sets `django.db.backends` to WARNING (no SQL echo in prod)

In `development.py`, override `LOGGING` to:
- Set root level to DEBUG
- Enable SQL query echo via `django.db.backends` at DEBUG level

---

### 7. Health check endpoint — config/urls.py

Add a lightweight `GET /api/health/` endpoint that requires no auth and returns:
```json
{ "data": { "status": "ok" }, "meta": null }
```
Implement it as a simple function view in a new `backend/config/views.py` file.
Mark it with `@api_view(["GET"])` and `@permission_classes([AllowAny])`.
Wire it in `config/urls.py`.

---

### 8. urls.py — JWT auth routes

Wire JWT token endpoints into `config/urls.py`:
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
```

---

## Constraints
- Read all referenced docs before writing code
- Do not implement FeatureRequest, Vote, Category, Status, or Role models — only User
- Do not add any migration other than the initial users migration file
- Do NOT run manage.py migrate — only generate the migration file
- Follow `docs/engineering/backend/api-conventions.md` for response shapes
- Follow `docs/architecture/backend-architecture.md` for layer rules
- Keep all changes in the files named above — do not create new apps or top-level dirs
- After all changes, run: `cd /home/isam/prj/feature-rank/backend && python manage.py check --settings=config.settings.development` and show the output
- Also append the prompt and action taken to `/home/isam/prj/feature-rank/PROMPT_HISTORY.md` using the required format:

```
## [2026-03-26T12:30:00Z] – Configure Django project layer

### Prompt
<full prompt content>

### Action Taken
<concise description>
```

### Action Taken
Read data-modeling.md, system-overview.md, security.md, and api-conventions.md. Updated User model in apps/users/models.py to add required `name` (CharField 150, not blank), `email` (EmailField 254, unique), `is_admin` (BooleanField, default False), and email lowercase normalization in save(). Generated initial migration 0001_initial.py for the users app. Added MySQL OPTIONS (utf8mb4 charset + STRICT_TRANS_TABLES) to DATABASES in base.py using setdefault to avoid overwriting dj_database_url fields. Added SIMPLE_JWT block (15min access, 7day refresh, rotate=True, blacklist=False, Bearer header, user_id claim). Created config/drf_exception_handler.py mapping ValidationError→400 with details, NotAuthenticated/AuthenticationFailed→401, PermissionDenied→403, NotFound→404, all others→500 with generic message. Created config/drf_renderer.py (EnvelopeRenderer) wrapping all non-error, non-paginated responses in {"data": ..., "meta": null}. Registered both in REST_FRAMEWORK in base.py. Added LOGGING dict to base.py (console handler, plain formatter, django.request and django.db.backends at WARNING). Overrode LOGGING in development.py (root DEBUG, django.db.backends DEBUG for SQL echo). Updated production.py with all required security settings plus WhiteNoise middleware inserted after SecurityMiddleware. Added whitenoise>=6.6,<7.0 to pyproject.toml dependencies. Created config/views.py with health_check function view (AllowAny). Updated config/urls.py to wire health check at /api/health/, JWT endpoints at /api/auth/token/ and /api/auth/token/refresh/. Ran `manage.py check` — 0 issues.

---

## [2026-03-26T12:00:00Z] – Set up production-grade Docker configuration for the monorepo

### Prompt
You are a senior DevOps engineer. Set up a complete, production-grade Docker
configuration for this monorepo project. Read the existing codebase structure
before writing anything. The goal is a setup that is secure, layered by
environment (dev vs prod), and easy for any developer to run locally.

---

## Stack constraints (fixed — do not deviate)
- **Database: MySQL 8.4 (latest stable LTS)**
- **Backend base image: python:3.13-slim (latest stable)**
- **Frontend base image: node:22-alpine (latest LTS) for build stages**
- **Frontend prod server: nginx:1.27-alpine (latest stable)**
- All image versions must be pinned to a specific tag — never use `latest`

---

## What to produce

### 1. .dockerignore files
Create one per service (backend and frontend). Exclude: .git, __pycache__,
*.pyc, node_modules, .env*, test artifacts, coverage reports, local IDE files,
and anything that should not enter the build context.

### 2. docker-compose.yml — development
Default compose file for local development. Requirements:
- Named Docker network (do NOT use the default bridge network)
- All credentials come from environment variables with safe fallbacks for dev
- Services have explicit healthchecks (use exec form, not shell form)
- `depends_on` uses `condition: service_healthy` — never just service name
- Backend and frontend use bind-mount source volumes for hot-reload
- Node modules are preserved via an anonymous volume so host `node_modules`
  never shadow the container-built ones
- **MySQL data persisted in a named volume (`mysql_data`) mapped to
  `/var/lib/mysql` — never use a bind mount for DB data**
- DB init SQL scripts mounted read-only under `docker-entrypoint-initdb.d`.
  Include a script that grants the app user full privileges on the
  `test_<DB_NAME>` database so Django's test runner can create it without
  needing root credentials
- Volumes section at the bottom must declare ALL named volumes explicitly
  (`mysql_data` and any others)

### 3. docker-compose.prod.yml — production override
An override file (`docker-compose -f docker-compose.yml -f docker-compose.prod.yml`).
Requirements:
- Remove all source bind mounts
- **mysql_data named volume still present — data must survive container restarts
  and re-deploys**
- Backend: run with gunicorn (if Django/Flask) or the production WSGI/ASGI
  server appropriate for the framework; never use the dev server in prod
- Frontend: multi-stage build that compiles static assets, then serves them
  with nginx:1.27-alpine. Include a `/healthz` endpoint in the nginx config.
- **MySQL port (3306) NOT exposed to host in prod — only exposed in dev**
- `restart: always` (not `unless-stopped`) for all services
- No hardcoded secrets — all sensitive values must come from env vars

### 4. Backend Dockerfile
Multi-stage:
- Stage `builder`: **FROM python:3.13-slim** — install OS deps and pip packages
  into a virtualenv
- Stage `runtime`: **FROM python:3.13-slim** — copy only the virtualenv and app
  source; no build tools in the final image
- Run as a non-root user (create a dedicated user, e.g. `appuser`)
- Set PYTHONUNBUFFERED=1 and PYTHONDONTWRITEBYTECODE=1
- Install `default-libmysqlclient-dev` in the builder stage (required by
  mysqlclient); the runtime stage only needs `libmysqlclient21` (runtime lib,
  no headers or build tools)
- ENTRYPOINT via a minimal `entrypoint.sh` that: waits for DB readiness,
  runs migrations (dev only — skip in prod or make it a separate init
  container step), then execs the app server
- EXPOSE the correct port

### 5. Frontend Dockerfile
Multi-stage:
- Stage `deps`: **FROM node:22-alpine** — install only production node_modules
- Stage `builder`: copy deps + source, run `npm run build`
- Stage `runner` (prod): **FROM nginx:1.27-alpine** — copy built assets,
  include a custom nginx.conf that: disables version disclosure (`server_tokens off`),
  sets security headers (X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, CSP skeleton), configures gzip, and handles SPA fallback
  routing (`try_files $uri $uri/ /index.html`)
- For dev, a single-stage that installs all deps and runs `npm run dev`
  with host binding to 0.0.0.0

### 6. .env.example
Comprehensive example env file with every variable the compose stack reads.
Group by service with comments. Mark secrets clearly. Never put real secrets
in this file. Must include at minimum:

MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_ROOT_PASSWORD=
DJANGO_SECRET_KEY=
DJANGO_ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
VITE_API_BASE_URL=


### 7. docker/ directory — init and config files
- `docker/mysql/01-grant-test-db.sql` — grants app user full privileges on
  `test_<MYSQL_DATABASE>` so Django test runner works without root
- `docker/nginx/nginx.conf` and site config
- Each file mounted read-only in compose

---

## Security requirements (non-negotiable)
- No service runs as root in production images
- No secrets baked into images; all come from env vars
- No `privileged: true` and no unnecessary capabilities
- MySQL port exposed to host only in dev
- nginx security headers applied

## Quality requirements
- Every `RUN` layer in Dockerfiles is justified by a comment if non-obvious
- Each compose service block has a comment header explaining its role
- Layer ordering optimised for cache: dependencies installed before source
  is copied
- All healthchecks use exec form (JSON array), not shell string form
- **MySQL healthcheck must use `mysqladmin ping` with `-u root` and
  a `start_period` of at least 60s to allow init scripts to complete**

---

## How to proceed
1. First, read the entire project tree to understand the stack: language,
   framework, package manager, existing config
2. Confirm you found MySQL usage, backend framework, frontend framework/bundler
3. Only then write the files — adapt everything above to the actual stack
4. After writing, output a "what was created" summary and the exact
   `docker compose up --build` command to start the stack

Do NOT guess the stack. Read it first.

### Action Taken
Read full project tree, confirmed Django 5 + DRF + Vite + React stack. Flagged that existing pyproject.toml used psycopg (PostgreSQL) not mysqlclient (MySQL). Created 12 files: backend/.dockerignore, frontend/.dockerignore, backend/Dockerfile (builder+runtime multi-stage, python:3.13-slim, appuser non-root, mysqlclient), backend/entrypoint.sh (Python socket wait + conditional migrate), frontend/Dockerfile (deps+builder+runner+dev stages, node:22-alpine, nginx:1.27-alpine), docker/nginx/nginx.conf (server_tokens off, gzip), docker/nginx/default.conf (security headers, SPA fallback, /healthz, asset caching), docker/mysql/01-grant-test-db.sh (creates test_<MYSQL_DATABASE>, grants app user), docker-compose.yml (full dev stack, named network feature_rank_net, mysql_data volume, healthchecks, anonymous node_modules volume), docker-compose.prod.yml (gunicorn, nginx runner, MySQL port unexposed, restart:always), .env.example (all variables, secrets blank). Updated backend/pyproject.toml: swapped psycopg[binary] for mysqlclient>=2.2 and added gunicorn>=22.0.

## [2026-03-26T19:30:00Z] – Implement all backend domain models, services, selectors, and API endpoints

### Prompt
You are the backend-engineer agent for the Django monorepo at /home/isam/prj/feature-rank.

## Phase 0 — Required reading (do this before writing a single line of code)

Read all of the following documents in full before implementing anything. These are not optional:

1. `docs/engineering/backend/data-modeling.md`
2. `docs/domain/voting-rules.md`
3. `docs/engineering/backend/api-conventions.md`
4. `docs/engineering/backend/security.md`
5. `docs/architecture/backend-architecture.md`
6. `docs/engineering/global/testing-strategy.md`
7. `docs/domain/feature-voting.md`
8. `docs/architecture/system-overview.md`
9. `backend/config/settings/base.py`
10. `backend/apps/users/models.py`

Do not skip any of these. Every implementation decision below is governed by one or more of these documents.

---

## Phase 1 — Domain models and migrations

Implement models strictly following `docs/engineering/backend/data-modeling.md`.

### apps/roles/models.py
- `Role`: name (CharField, max 50, unique), description (TextField, blank=True), created_at (auto_now_add)
- DB table: `roles`, ordering: `["name"]`

### apps/categories/models.py
- `Category`: name (CharField, max 100, unique), icon (CharField, max 100, blank=False), color (CharField, max 7), created_at (auto_now_add)
- DB table: `categories`

### apps/statuses/models.py
- `Status`: name (CharField, max 100, unique), color (CharField, max 7), is_terminal (BooleanField, default False), sort_order (IntegerField, unique), created_at (auto_now_add), updated_at (auto_now)
- DB table: `statuses`, ordering: `["sort_order"]`

### apps/feature_requests/models.py
- `FeatureRequest`: title (CharField, max 255), description (TextField), rate (IntegerField, validators=[MinValue(1), MaxValue(5)]), author (FK→User, on_delete=PROTECT), category (FK→Category, on_delete=PROTECT), status (FK→Status, on_delete=PROTECT), created_at (auto_now_add), updated_at (auto_now)
  - DB table: `feature_requests`; no default ordering (ordering is applied in selectors)
- `Vote`: user (FK→User, on_delete=CASCADE), feature_request (FK→FeatureRequest, on_delete=CASCADE, related_name="votes"), created_at (auto_now_add)
  - DB table: `votes`; `unique_together = [("user", "feature_request")]` — MANDATORY

After writing all models, generate migrations for all four apps in this order: roles, categories, statuses, feature_requests. Use `--settings=config.settings.test` to avoid MySQL driver issues.

Do NOT run migrate.

---

## Phase 2 — Pagination class

Create `backend/config/pagination.py` with a `StandardResultsPagination` class (PageNumberPagination):
- `page_size = 20`, `max_page_size = 100`, `page_query_param = "page"`, `page_size_query_param = "limit"`
- Override `get_paginated_response` to return:
  ```json
  { "data": [...], "meta": { "page": N, "limit": N, "total": N, "total_pages": N } }
  ```

Register it in `REST_FRAMEWORK` settings as `DEFAULT_PAGINATION_CLASS`.

---

## Phase 3 — Permission classes

### apps/users/permissions.py
- `IsAuthenticated` is already in DRF — do not duplicate it
- No custom permissions needed for users

### apps/categories/permissions.py
- `IsAdminOrReadOnly`: admin users can write; anyone can read

### apps/statuses/permissions.py
- `IsAdminOrReadOnly`: same pattern

### apps/feature_requests/permissions.py
- `IsAuthorOrAdmin`: user is the author of the feature request OR is_admin=True
- Used for edit and delete operations

---

## Phase 4 — Serializers

### apps/users/serializers.py
- `UserRegistrationSerializer`: fields `username`, `email`, `name`, `password` (write-only). `validate_email` normalizes to lowercase. `create` calls `register_user` service.
- `UserMeSerializer`: read-only. Fields: `id`, `username`, `name`, `email`, `is_admin`, `date_joined`.

### apps/categories/serializers.py
- `CategorySerializer`: all fields (id, name, icon, color, created_at). Read-only for list/detail.

### apps/statuses/serializers.py
- `StatusSerializer`: all fields (id, name, color, is_terminal, sort_order, created_at, updated_at).

### apps/feature_requests/serializers.py
- `AuthorSerializer`: fields `id`, `name` only — no email
- `CategoryNestedSerializer`: fields `id`, `name`, `icon`, `color`
- `StatusNestedSerializer`: fields `id`, `name`, `color`, `is_terminal`
- `FeatureRequestListSerializer`: all list fields including `vote_count` and `has_voted` as SerializerMethodField (reads annotated attrs from queryset)
- `FeatureRequestWriteSerializer`: input serializer for create/update. Fields: `title`, `description`, `rate`, `category_id`. All `required=False` (PATCH semantics). `validate_rate`: rejects values outside 1–5. `validate_category_id`: checks Category exists.

Never include `author_id`, `status_id`, or `vote_count` as writable fields on any non-admin serializer.

---

## Phase 5 — Selectors

### apps/feature_requests/selectors.py
Implement `get_feature_requests_list(*, user=None, category_id=None, status_id=None, author_id=None, sort=None)`:
- Annotates `vote_count = Count("votes", distinct=True)`
- Annotates `has_voted` using `Exists(Vote.objects.filter(user=user, feature_request=OuterRef("pk")))` — False when user is None or anonymous
- Uses `select_related("author", "category", "status")`
- Applies filters: `category_id`, `status_id`, `author_id` if provided
- Applies ordering from `sort` param. Allowed values: `"-vote_count"` (default), `"vote_count"`, `"-created_at"`, `"created_at"`. Default order: `["-vote_count", "-created_at", "-id"]`. Ascending vote_count: `["vote_count", "-created_at", "-id"]`. Never include `rate` in any ordering.
- If `sort` is an unrecognized value → raise `ValidationError`
- Returns a queryset

Implement `get_feature_request_detail(*, pk, user=None)`:
- Same annotations as above
- Returns a single object or raises `NotFound`

### apps/categories/selectors.py
- `get_categories_list()` → ordered queryset
- `get_category(pk)` → single object or NotFound

### apps/statuses/selectors.py
- `get_statuses_list()` → ordered queryset
- `get_status(pk)` → single object or NotFound

### apps/users/selectors.py
- `get_current_user(user)` → returns the user object

---

## Phase 6 — Services

### apps/users/services.py
- `register_user(*, username, email, name, password)`: validates email uniqueness, creates user. Raises `ValidationError` on duplicate email.

### apps/categories/services.py
- `create_category(*, name, icon, color)` → Category
- `update_category(*, category, data: dict)` → Category
- `delete_category(*, category)`: raises `ValidationError` if category is referenced by any FeatureRequest

### apps/statuses/services.py
- `create_status(*, name, color, is_terminal, sort_order)` → Status
- `update_status(*, status, data: dict)` → Status
- `delete_status(*, status)`: raises `ValidationError` if status is referenced by any FeatureRequest

### apps/feature_requests/services.py
Implement all of the following:

`create_feature_request(*, user, title, description, rate, category_id)`:
- Sets `author = user` always (never from request body)
- Looks up `Status` with `name__iexact="open"`. Raises `ValidationError` if not found.
- Returns created FeatureRequest

`update_feature_request(*, feature_request, user, data: dict)`:
- Silently pops `author_id` and `vote_count` from data (ignored always)
- If `status_id` present in data AND `user.is_admin is False` → raise `PermissionDenied`
- If `status_id` present AND user is admin → validates transition using VALID_TRANSITIONS dict
- Updates only provided fields (PATCH semantics)
- Returns updated FeatureRequest

`delete_feature_request(*, feature_request)`:
- Deletes the object

`vote_feature_request(*, feature_request, user)`:
- Application-layer check: if vote already exists → skip insert
- Attempts `Vote.objects.create(...)`. Catches `IntegrityError` (concurrent duplicate) — do not re-raise.
- Returns `{"feature_request_id": ..., "has_voted": True, "vote_count": <current count>}`

`unvote_feature_request(*, feature_request, user)`:
- Deletes vote if it exists. If no vote → do nothing (idempotent).
- Returns `{"feature_request_id": ..., "has_voted": False, "vote_count": <current count>}`

VALID_TRANSITIONS:
```python
{
    "open": {"planned", "rejected"},
    "planned": {"in progress", "rejected"},
    "in progress": {"completed", "rejected"},
    "completed": set(),
    "rejected": set(),
}
```

Status transition validation: if new status name not in allowed set for current status → raise `ValidationError`.

---

## Phase 7 — Views and ViewSets

### apps/users/views.py
- `RegisterView` (APIView): POST, AllowAny, calls UserRegistrationSerializer, returns 201
- `MeView` (APIView): GET, IsAuthenticated, returns current user via UserMeSerializer

### apps/categories/views.py
- `CategoryViewSet` (ViewSet): list (GET, AllowAny), retrieve (GET, AllowAny), create (POST, IsAdminOrReadOnly), update/partial_update (PATCH, IsAdminOrReadOnly), destroy (DELETE, IsAdminOrReadOnly)

### apps/statuses/views.py
- `StatusViewSet` (ViewSet): same pattern as CategoryViewSet

### apps/feature_requests/views.py
- `FeatureRequestViewSet` (ViewSet): list, retrieve (both AllowAny), create (IsAuthenticated), partial_update (IsAuthenticated + IsAuthorOrAdmin), destroy (IsAuthenticated + IsAuthorOrAdmin)
- In `list`: validate `sort` param — reject `"rate"` and `"-rate"` → 400 with error envelope; reject unknown sort values → 400
- In `create`: silently pop `author_id` from request data; if `status_id` in data and user is not admin → return 403
- In `partial_update`: if `status_id` in data and user is not admin → return 403; else pass to service
- Vote action: `@action(detail=True, methods=["post", "delete"], url_path="vote", permission_classes=[IsAuthenticated])`
  - POST → `vote_feature_request`, always returns 200 with `{"data": {"feature_request_id": ..., "has_voted": true, "vote_count": N}, "meta": null}`
  - DELETE → `unvote_feature_request`, always returns 200 with same shape

---

## Phase 8 — URL routing

### apps/users/urls.py
- `POST /api/users/register/` → RegisterView
- `GET /api/users/me/` → MeView

### apps/categories/urls.py
- Use DefaultRouter, register CategoryViewSet at `"categories"`

### apps/statuses/urls.py
- Use DefaultRouter, register StatusViewSet at `"statuses"`

### apps/feature_requests/urls.py
- Use DefaultRouter, register FeatureRequestViewSet at `"features"`
- Vote action is auto-routed by the router via the `@action` decorator

Wire all in `config/urls.py` under `/api/`.

---

## Phase 9 — Admin registration

Register all models in their respective `admin.py` files:
- roles/admin.py: RoleAdmin
- categories/admin.py: CategoryAdmin
- statuses/admin.py: StatusAdmin
- feature_requests/admin.py: FeatureRequestAdmin, VoteAdmin

---

## Phase 10 — Seed management command

Create `apps/feature_requests/management/commands/seed_reference_data.py`.

This command must be idempotent (use `get_or_create`). It seeds:

**Roles:**
- member, moderator, admin

**Categories:** (name, icon, color)
- Bug Report, bug, #EF4444
- Feature Request, sparkles, #3B82F6
- UI/UX Improvement, palette, #8B5CF6
- Performance, zap, #F59E0B
- Documentation, book-open, #10B981

**Statuses:** (name, color, is_terminal, sort_order)
- open, #6B7280, False, 0
- under review, #3B82F6, False, 1
- planned, #8B5CF6, False, 2
- in progress, #F59E0B, False, 3
- completed, #10B981, True, 4
- rejected, #EF4444, True, 5

Print a summary of what was created vs already existed.

---

## Phase 11 — Tests

Write tests for all of the following. Use Django TestCase. Tests must be in:
- `apps/feature_requests/tests/test_models.py`
- `apps/feature_requests/tests/test_services.py`
- `apps/feature_requests/tests/test_selectors.py`
- `apps/feature_requests/tests/test_views.py`
- `apps/users/tests/test_views.py`

Each test module must have a module-level docstring explaining what it tests.

### Mandatory test coverage

**Models:**
- Vote DB unique constraint prevents duplicate (user, feature_request) pair
- Different users can each vote once on the same feature
- vote_count annotation (Count("votes")) returns correct count

**Services — vote:**
- `vote_feature_request` creates exactly one Vote record
- Calling it twice for the same user+feature → still only one Vote record (idempotency)
- Duplicate vote returns has_voted=True and correct vote_count
- Self-voting (author votes their own feature) is permitted
- Multiple users voting → vote_count increments correctly

**Services — unvote:**
- Removes existing vote, returns has_voted=False
- Unvoting when no vote exists → returns has_voted=False, vote_count=0 (no exception)
- Returns feature_request_id in response

**Services — create:**
- author is always set from the user argument (never from data)
- status is always "open"
- missing "open" status → raises ValidationError

**Services — update:**
- non-admin submitting status_id → raises PermissionDenied
- admin can change status_id
- author_id in data is silently ignored (author unchanged after update)
- vote_count in data is silently stripped
- PATCH semantics: only provided fields updated

**Selectors:**
- Default ordering: vote_count DESC → created_at DESC → id DESC
- sort=vote_count (ascending) is respected
- rate does NOT affect ranking (high-rate feature with fewer votes ranked lower than low-rate with more votes)
- has_voted=True for user who voted
- has_voted=False for user who did not vote
- has_voted=False for anonymous (user=None)

**Views:**
- POST /api/users/register/ with valid data → 201
- POST /api/users/register/ with duplicate email → 400
- GET /api/users/me/ without auth → 401
- GET /api/users/me/ with valid auth → 200 with user data
- GET /api/features/ returns paginated list with vote_count, has_voted, nested status/category/author
- GET /api/features/ with sort=rate → 400
- GET /api/features/ with sort=-vote_count (valid) → 200
- POST /api/features/ without auth → 401
- POST /api/features/ with auth → 201, author set to authenticated user
- POST /api/features/ with author_id in body → 201, author is still the authenticated user
- PATCH /api/features/{id}/ by non-author, non-admin → 403
- PATCH /api/features/{id}/ with status_id by non-admin → 403
- DELETE /api/features/{id}/ by non-author, non-admin → 403
- POST /api/features/{id}/vote/ → 200 with has_voted=True
- POST /api/features/{id}/vote/ twice → 200 idempotent, still 1 Vote record
- DELETE /api/features/{id}/vote/ → 200 with has_voted=False
- DELETE /api/features/{id}/vote/ when no vote → 200 idempotent
- POST /api/features/{id}/vote/ without auth → 401

---

## Phase 12 — Final check

After all phases complete, run:
```
cd /home/isam/prj/feature-rank/backend && python3 manage.py check --settings=config.settings.test
```

And run:
```
python3 manage.py makemigrations --check --settings=config.settings.test
```

Both must pass with zero issues. If they don't, fix all issues before finishing.

---

## Hard constraints

- `rate` must NEVER appear in any `order_by()` call. Not as a primary sort, not as a tiebreaker, nowhere.
- `vote_count` must NEVER be stored on FeatureRequest. Always computed via Count annotation.
- `author_id` on feature request creation always comes from `request.user`. Never from request body.
- `status_id` changes are admin-only. Non-admin attempting to change status → 403.
- Duplicate vote → 200 OK, not 409. Missing-vote unvote → 200 OK, not 404.
- Vote unique constraint on `(user_id, feature_request_id)` is mandatory. Do not omit it.
- Default test settings must use SQLite (no MySQL driver). Create `config/settings/test.py` if it doesn't exist.
- All tests use Django TestCase. No pytest-django decorators.
- Run all tests with: `python3 -m django test apps --settings=config.settings.test`

### Action Taken
Read all 10 required documents before writing any code. Created config/settings/test.py with SQLite in-memory database to avoid MySQL driver requirement during testing. Implemented all 5 domain models with correct field types, constraints, and on_delete behaviors per data-modeling.md. Generated migrations for roles, categories, statuses, and feature_requests apps. Created config/pagination.py with StandardResultsPagination producing {data, meta} envelope. Implemented permission classes: IsAdminOrReadOnly for categories and statuses, IsAuthorOrAdmin for feature requests. Implemented serializers for all apps including nested read serializers and separate write serializers for feature requests. Implemented selectors with vote_count/has_voted annotations, explicit select_related, and canonical ordering (vote_count DESC, created_at DESC, id DESC). Implemented services for all apps including idempotent vote/unvote (get_or_create + IntegrityError catch), status transition validation via VALID_TRANSITIONS dict, and protected field handling (author_id silently popped, status_id blocked for non-admin). Implemented views as ViewSets for all apps. Vote action (@action on FeatureRequestViewSet) always returns 200. List view rejects sort=rate/-rate with 400. Wired DefaultRouter for categories, statuses, feature_requests; manual paths for users. Registered all models in admin. Created seed_reference_data management command with get_or_create for idempotency. Wrote tests in test_models.py, test_services.py, test_selectors.py, test_views.py for feature_requests app and test_views.py for users app. Fixed test setUp to create Status(name="open") for CreateFeatureRequestServiceTest. All 57 tests pass. manage.py check clean. makemigrations --check clean.

---

## [2026-03-26T19:00:00Z] – Implement full React frontend

### Prompt
You are completing the frontend implementation of a Feature Voting System.
The skeleton is already in place — directory structure, routing, AuthProvider,
Axios instance, and TanStack Query are all configured correctly. Nothing
structural needs to change.

Read these docs before writing any code:
- docs/architecture/frontend-architecture.md
- docs/engineering/frontend/react-standards.md
- docs/engineering/frontend/api-consumption.md
- docs/engineering/frontend/state-management.md
- docs/engineering/frontend/ui-ux-guidelines.md
- docs/engineering/backend/api-conventions.md

Also read the backend API contract to understand exact response shapes,
field names, and error formats before typing anything.

Implement in this order:

1. **Types** — complete src/types/ with FeatureRequest, FeatureRequestSummary,
   Category, Status, Vote. Field names must match the API exactly (snake_case).

2. **Service layer** — implement all stub functions in auth.ts, voting.ts,
   categories.ts, statuses.ts. features.ts is already done. No fetch/axios
   outside services/.

3. **Query keys** — define constants in each feature's queryKeys.ts. No inline
   strings in hooks.

4. **Reusable components** — build in src/components/: Button, Spinner,
   EmptyState, ErrorMessage, Badge. Each in its own kebab-case folder with
   index.tsx. No domain logic in these components.

5. **Feature hooks** — implement hooks inside each feature's hooks/ directory:
   useFeatureList, useFeatureDetail, useCreateFeature, useUpdateFeature,
   useDeleteFeature, useCastVote, useRemoveVote, useCategories, useStatuses.
   All mutations invalidate the relevant query keys on success. Vote/unvote
   use the mutation response for the one permitted optimistic update.

6. **Feature components** — build the domain-specific components inside each
   feature's components/ directory (e.g. FeatureCard, VoteButton,
   FeatureForm, StatusBadge, CategoryBadge).

7. **Pages** — implement all 5 pages by assembling feature components + hooks.
   Every async operation must handle loading, error, and empty states using
   the shared components from step 4. No data fetching in pages directly.

8. **Forms** — CreateFeaturePage and EditFeaturePage use React Hook Form.
   Backend 400 error.details must map to field-level errors. Do not include
   author_id or status_id in non-admin form payloads.

9. **Route guards** — ProtectedRoute is already implemented. Verify it is
   applied correctly to all protected pages.

Constraints that must never be violated:
- Feature list order comes from the API. Never use Array.sort() on it.
- has_voted and vote_count come from the API only.
- No business logic in components.
- No API calls outside services/.
- No inline query key strings.
- TypeScript strict mode — no `any`.
- Every async operation handles all 3 states: loading, error, empty.
- Silent failures are prohibited.

After completing the implementation, run `cd frontend && npx tsc --noEmit` to verify there are no TypeScript errors, and fix any that appear before finishing.

### Action Taken
Read all 6 required docs and all existing skeleton files before writing any code. Fixed PaginationMeta in types/api.ts to match the API contract exactly (page, limit, total, total_pages instead of the pre-existing Django REST Framework paginator fields). Updated services/api.ts to include status code in ApiError and handle 401 redirect. Added "types": ["vite/client"] to tsconfig.json to resolve import.meta.env. Built all reusable components in components/ (spinner, error-message, empty-state, button, badge, pagination), each in a kebab-case directory with index.tsx. Implemented all feature hooks: useFeatureList, useFeatureDetail, useCreateFeature, useUpdateFeature, useDeleteFeature in features/feature-requests/hooks/; useCastVote and useRemoveVote in features/voting/hooks/ (both with full optimistic update: snapshot → estimate → send → overwrite with VoteResponse → rollback); useCategories in features/categories/hooks/; useStatuses in features/statuses/hooks/; useLogin in features/auth/hooks/. Built domain components: StatusBadge, CategoryBadge, VoteButton, FeatureCard, FeatureListFilters, FeatureForm, LoginForm. Implemented all 5 pages: FeatureListPage (filters, pagination, loading/error/empty states, vote), FeatureDetailPage (detail view, vote, edit/delete for author/admin, 404 handling), CreateFeaturePage (RHF form, navigates to new feature on success), EditFeaturePage (pre-fills from API, navigates to detail on success), LoginPage (redirects if already authenticated). All forms map backend 400 error.details to field-level errors via setError. No author_id or status_id in non-admin payloads. Feature list never sorted. All 3 async states handled everywhere. TypeScript compiled with zero errors.

---
## [2026-03-26T12:00:00Z] – Add Mantine v7 UI framework and implement production-ready theme

### Prompt
You are a senior frontend engineer and design systems specialist working in the feature-rank monorepo.

## Context

The frontend is a React 18 + TypeScript + Vite app located at `frontend/`. It already has:
- React Router v6 with 5 routes
- TanStack Query v5
- Axios centralized instance in `services/api.ts`
- React Hook Form
- AuthProvider and ProtectedRoute already implemented
- All pages, hooks, services, and feature components already implemented

You are adding **Mantine v7** as the UI framework and implementing a complete, production-ready theme.

**Important:** Read the existing files before touching anything:
- `frontend/package.json` — check current deps
- `frontend/src/app/router.tsx` — routing setup
- `frontend/src/app/AuthProvider.tsx` — auth context
- `frontend/src/main.tsx` — app entry point
- `frontend/src/components/` — existing shared components (Button, Badge, Spinner, etc.)
- `frontend/src/features/` — existing feature components

---

## Task

### Step 1 — Install Mantine v7

Install these packages:
```
@mantine/core @mantine/hooks @mantine/notifications @mantine/dates
```
Also install the required peer dep:
```
postcss postcss-preset-mantine postcss-simple-vars
```

Create `frontend/postcss.config.cjs`:
```js
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

Add `@import '@mantine/core/styles.css';` and `@import '@mantine/notifications/styles.css';` to `frontend/src/main.tsx` (or `index.css`) before any other styles.

---

### Step 2 — Create `frontend/src/styles/theme.ts`

A complete Mantine theme using `createTheme`. Requirements:

**Colors:**
- Primary: indigo (use Mantine's built-in `indigo` color — it maps to `#6366F1` range)
- Primary color key: `'indigo'`, primaryShade: `{ light: 6, dark: 4 }`
- No custom palette overrides needed — use Mantine's defaults for indigo, green, yellow, red

**Typography:**
```ts
fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
fontFamilyMonospace: '"JetBrains Mono", "Fira Code", monospace',
headings: {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: '600',
  sizes: {
    h1: { fontSize: '1.875rem', lineHeight: '1.3' },
    h2: { fontSize: '1.5rem',   lineHeight: '1.35' },
    h3: { fontSize: '1.25rem',  lineHeight: '1.4' },
    h4: { fontSize: '1.125rem', lineHeight: '1.45' },
    h5: { fontSize: '1rem',     lineHeight: '1.5' },
    h6: { fontSize: '0.875rem', lineHeight: '1.5' },
  },
},
fontSizes: { xs:'0.75rem', sm:'0.875rem', md:'0.9375rem', lg:'1rem', xl:'1.125rem' },
lineHeights: { xs:'1.4', sm:'1.45', md:'1.55', lg:'1.6', xl:'1.65' },
```

**Spacing:** `{ xs:'0.5rem', sm:'0.75rem', md:'1rem', lg:'1.5rem', xl:'2rem' }`

**Radius:** `{ xs:'4px', sm:'6px', md:'8px', lg:'12px', xl:'16px' }`, defaultRadius: `'md'`

**Shadows (subtle):**
```ts
shadows: {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
  xl: '0 20px 25px rgba(0,0,0,0.06), 0 10px 10px rgba(0,0,0,0.03)',
},
```

**Component defaults — this section is critical:** (Button, Badge, TextInput, NavLink, Table, Paper, Card, AppShell, Notification component styles)

Also add: `other: { sidebarWidth: 220, headerHeight: 60 }`

---

### Step 3 — Update `frontend/src/main.tsx`

Wrap the app with `MantineProvider` and `Notifications`.

---

### Step 4 — Create the AppShell layout

Create `frontend/src/app/AppLayout.tsx` — the main authenticated layout using Mantine's `AppShell`.

The layout must match the prototype design:
- Left sidebar (220px wide, `AppShell.Navbar`)
- Top header (`AppShell.Header`, 60px)
- Main content area: `AppShell.Main` renders `children`

---

### Step 5 — Update the router to use AppLayout

In `frontend/src/app/router.tsx`, wrap the authenticated routes (everything except `/login`) inside `AppLayout`.

---

### Step 6 — Replace existing primitive components with Mantine equivalents

Replace spinner, button, badge, empty-state, error-message, pagination implementations to use Mantine components.

---

### Step 7 — Restyle the FeatureCard to match the prototype

Update `features/feature-requests/components/feature-card/index.tsx` to use Mantine components with a new props interface:
```ts
interface FeatureCardProps {
  feature: FeatureRequest;
  onVote: () => void;
  isVoting: boolean;
}
```

---

### Constraints

- Install `@tabler/icons-react` for icons
- Use Mantine v7 API throughout (CSS Modules based, not emotion)
- No inline styles except where Mantine's `styles` prop is the right tool
- TypeScript strict — no `any`
- Do not break existing service/hook imports
- After all changes, run `cd frontend && npx tsc --noEmit` and fix all TypeScript errors before finishing

### Action Taken
Read all existing files (package.json, main.tsx, router.tsx, AuthProvider.tsx, all components, feature-card, feature types, voting hooks, FeatureListPage) before making any changes. Installed @mantine/core, @mantine/hooks, @mantine/notifications, @mantine/dates, @tabler/icons-react, postcss, postcss-preset-mantine, postcss-simple-vars. Created frontend/postcss.config.cjs with Mantine breakpoint variables. Created frontend/src/styles/theme.ts with createTheme (indigo primary, Inter typography, custom spacing/radius/shadows, component defaults). Updated main.tsx to add Mantine CSS imports at the top and wrap the tree with MantineProvider and Notifications (preserving existing QueryClientProvider and AuthProvider). Created frontend/src/app/AppLayout.tsx using AppShell with 220px navbar, 60px header, nav links with Tabler icons, admin section gated on user.is_admin, user profile strip at bottom. Updated router.tsx to wrap all non-login routes in AppLayout with contextual title/subtitle props. Replaced all 6 component stubs in src/components/ with Mantine-backed implementations (Spinner→Loader, Button→MantineButton with variant/color mapping, Badge wrapper preserving CSS color prop, EmptyState using Stack/ThemeIcon/Anchor, ErrorMessage using Alert, Pagination using MantinePagination). Rewrote FeatureCard to use Mantine Card/Group/Stack/ActionIcon with integrated VoteWidget, Rating display, Avatar with initials, and the new simplified onVote: () => void props interface. Updated FeatureListPage to pass the resolved onVote callback (dispatching castVote or removeVote based on has_voted), removed unused imports (Link, Button), used Mantine layout primitives (Stack, Center). Ran npx tsc --noEmit — zero TypeScript errors.

---


## [2026-03-26T00:00:00Z] – Add Mantine design system and theme

### Prompt
ok so for frontend lets do the following instruction:

You are a senior frontend engineer and design systems specialist.

I am building a modern SaaS dashboard using React and Mantine. I want you to help me define and implement a complete, production-ready Mantine theme configuration that results in a clean, professional, and cohesive UI similar to modern SaaS products (linear.app, stripe dashboard, notion, etc).

## Goals

* Clean, minimal, modern SaaS UI
* High readability and good visual hierarchy
* Consistent spacing, radius, and typography
* Subtle use of colors and shadows (no heavy UI)
* Works well for dashboards, lists, cards, and sidebars
* Fully supports light and dark mode

[... full prompt as provided by user ...]

### Action Taken
Installed Mantine v7 (@mantine/core, @mantine/hooks, @mantine/notifications, @mantine/dates), @tabler/icons-react, and PostCSS dependencies. Created frontend/postcss.config.cjs with Mantine breakpoint variables. Created frontend/src/styles/theme.ts with full createTheme config (indigo primary, Inter typography, custom spacing/radius/shadows, component defaults). Created frontend/src/app/AppLayout.tsx with AppShell sidebar (nav links, admin section, user profile strip) and header (search + new request button). Updated main.tsx to wrap app with MantineProvider and Notifications. Updated router.tsx to wrap authenticated routes in AppLayout. Replaced all stub components (Spinner, Button, Badge, EmptyState, ErrorMessage, Pagination) with Mantine-backed implementations preserving existing import paths. Fully restyled FeatureCard to match the prototype design (vote widget, category/status badges, star rating, author footer). Updated FeatureListPage to use new FeatureCard props. tsc --noEmit passed with zero errors.

---

## [2026-03-26T01:00:00Z] – Set up ESLint, Prettier, and TypeScript config split

### Prompt
You are a senior frontend engineer. Set up three things in this React + TypeScript + Vite project: ESLint, Prettier, and React Router. Read the existing project structure and package.json before touching anything.

[Full prompt included Prettier config, ESLint flat config (ESLint 9+), TypeScript three-file split (tsconfig.json / tsconfig.app.json / tsconfig.node.json), path alias @/ in vite.config.ts, and React Router setup instructions.]

### Action Taken
Installed prettier@^3, eslint@^9, @eslint/js@^9, globals@^15, typescript-eslint@^8, eslint-plugin-react-hooks@^5, eslint-plugin-react-refresh@^0.4, eslint-config-prettier@^9, and @types/node. Created .prettierrc and .prettierignore. Created eslint.config.js using flat config format. Split tsconfig into tsconfig.json (project references root), tsconfig.app.json (src/ code), and tsconfig.node.json (vite.config.ts). Added @/ path alias to vite.config.ts. Added lint, lint:fix, format, format:check scripts to package.json. Re-installed Mantine and Tabler icons (overwritten by worktree package.json copy). Ran prettier --write to auto-fix formatting across all src files. All three checks pass: npm run lint (0 errors, 1 expected warning), npm run format:check (all files pass), npx tsc --noEmit -p tsconfig.app.json (0 errors).

---

## [2026-03-26T21:00:00Z] – Write comprehensive backend test suite covering all apps

### Prompt
You are the backend-engineer agent for the Django monorepo at /home/isam/prj/feature-rank.

Your task is to write a comprehensive test suite that covers the entire backend. Read the existing test files and all source files before writing anything.

---

## Step 0 — Read everything first

Read these files before writing a single test:

**Existing tests (read all of them):**
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_models.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_services.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_selectors.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_views.py`
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_views.py`

**Source files:**
- `/home/isam/prj/feature-rank/backend/apps/users/models.py`
- `/home/isam/prj/feature-rank/backend/apps/users/views.py`
- `/home/isam/prj/feature-rank/backend/apps/users/serializers.py`
- `/home/isam/prj/feature-rank/backend/apps/users/services.py`
- `/home/isam/prj/feature-rank/backend/apps/users/selectors.py`
- `/home/isam/prj/feature-rank/backend/apps/users/permissions.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/models.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/views.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/serializers.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/services.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/selectors.py`
- `/home/isam/prj/feature-rank/backend/apps/categories/permissions.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/models.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/views.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/serializers.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/services.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/selectors.py`
- `/home/isam/prj/feature-rank/backend/apps/statuses/permissions.py`
- `/home/isam/prj/feature-rank/backend/apps/roles/models.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/models.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/views.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/serializers.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/services.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/selectors.py`
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/permissions.py`
- `/home/isam/prj/feature-rank/backend/config/urls.py`
- `/home/isam/prj/feature-rank/backend/config/views.py`
- `/home/isam/prj/feature-rank/backend/config/pagination.py`
- `/home/isam/prj/feature-rank/backend/config/drf_exception_handler.py`
- `/home/isam/prj/feature-rank/backend/config/drf_renderer.py`
- `/home/isam/prj/feature-rank/backend/docs/engineering/backend/testing-strategy.md` (read from /home/isam/prj/feature-rank/docs/engineering/backend/testing-strategy.md)

### Action Taken
Read all existing test files and all source files across the backend. Installed pytest-django (was missing from the environment). Created the following files:

- `/home/isam/prj/feature-rank/backend/conftest.py` — shared pytest fixtures for users, categories, statuses, feature_requests
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_serializers.py` — UserRegistrationSerializer and UserMeSerializer tests
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_services.py` — register_user service tests
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_selectors.py` — get_current_user selector tests
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_permissions.py` — IsAdminUser permission tests
- `/home/isam/prj/feature-rank/backend/apps/categories/tests/test_models.py` — Category model constraint tests
- `/home/isam/prj/feature-rank/backend/apps/categories/tests/test_serializers.py` — CategorySerializer tests
- `/home/isam/prj/feature-rank/backend/apps/categories/tests/test_services.py` — create/update/delete_category service tests
- `/home/isam/prj/feature-rank/backend/apps/categories/tests/test_selectors.py` — get_categories_list and get_category selector tests
- `/home/isam/prj/feature-rank/backend/apps/categories/tests/test_views.py` — all 5 category endpoints (list, retrieve, create, update, delete)
- `/home/isam/prj/feature-rank/backend/apps/statuses/tests/test_models.py` — Status model constraint tests
- `/home/isam/prj/feature-rank/backend/apps/statuses/tests/test_serializers.py` — StatusSerializer tests
- `/home/isam/prj/feature-rank/backend/apps/statuses/tests/test_services.py` — create/update/delete_status service tests
- `/home/isam/prj/feature-rank/backend/apps/statuses/tests/test_selectors.py` — get_statuses_list and get_status selector tests
- `/home/isam/prj/feature-rank/backend/apps/statuses/tests/test_views.py` — all 5 status endpoints
- `/home/isam/prj/feature-rank/backend/apps/roles/tests/test_models.py` — Role model constraint tests
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_serializers.py` — FeatureRequestWriteSerializer and FeatureRequestListSerializer tests
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_permissions.py` — IsAuthorOrAdmin permission tests
- `/home/isam/prj/feature-rank/backend/tests/test_health.py` — health check endpoint tests
- `/home/isam/prj/feature-rank/backend/tests/test_auth.py` — JWT token obtain and refresh tests
- `/home/isam/prj/feature-rank/backend/tests/test_pagination.py` — StandardResultsPagination behavior tests
- `/home/isam/prj/feature-rank/backend/tests/test_exception_handler.py` — custom exception handler error envelope tests

Modified existing test files to update URLs from /api/ to /api/v1/:
- `/home/isam/prj/feature-rank/backend/apps/feature_requests/tests/test_views.py`
- `/home/isam/prj/feature-rank/backend/apps/users/tests/test_views.py`

All 199 tests pass.
