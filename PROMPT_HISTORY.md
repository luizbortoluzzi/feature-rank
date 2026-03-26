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

## [2026-03-26T00:09:00Z] – Create repository governance and meta files

### Prompt
Create the following repository governance and meta files at the root of the project: `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `CHANGELOG.md`. These files must be professional, production-ready, and appropriate for a modern open-source or collaborative project. Do not generate placeholders or generic fluff. Each file must be complete, clear, and usable. Use MIT license. Base Code of Conduct on Contributor Covenant. SECURITY.md must define vulnerability reporting, response expectations, supported versions, and disclosure policy. CONTRIBUTING.md must cover project structure, local setup, coding standards, PR process, commit expectations, requirement to follow docs and use `.claude/` configuration. SUPPORT.md must cover question channels, bug reporting, support vs feature request distinction, and response model. CHANGELOG.md must follow Keep a Changelog format with an initial version entry.

### Action Taken
Created all 6 files. `LICENSE`: MIT, copyright 2026 feature-rank contributors. `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1 with expected/unacceptable behavior, 4-tier enforcement guidelines, and reporting instructions. `SECURITY.md`: Private reporting via GitHub security tab or email, 3-stage response timeline table, coordinated disclosure policy (max 90 days), in-scope/out-of-scope tables, and links to relevant security docs. `CONTRIBUTING.md`: Full setup instructions using Makefile targets, project structure overview, backend layer rules table, frontend rules summary, Claude Code agent/rules/hooks section, PR checklist, commit message guidelines, and changelog instructions. `SUPPORT.md`: Channels table (GitHub Discussions for questions, Issues for bugs), support-vs-feature-request table, best-effort response model. `CHANGELOG.md`: Keep a Changelog format, `[Unreleased]` section with full scaffold additions, `[0.1.0]` initial documentation release entry, comparison links (placeholder URLs marked).
