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
