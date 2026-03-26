# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial monorepo scaffold with Django backend and React + TypeScript frontend
- Django project structure with domain apps: `users`, `roles`, `categories`, `statuses`, `feature_requests`
- Custom `User` model with `is_admin` and `name` fields
- Split settings configuration (`base`, `development`, `production`)
- JWT authentication endpoints via `djangorestframework-simplejwt`
- React + Vite + TypeScript frontend with strict mode enabled
- TanStack Query v5 for server state management
- Centralized Axios instance with request/response interceptors
- React Router v6 with route-level code structure
- `AuthProvider` and `ProtectedRoute` components
- Typed service layer (`features.ts`, `voting.ts`, `auth.ts`, `categories.ts`, `statuses.ts`)
- API types in `snake_case` matching the documented API contract
- Feature directory structure per architecture documentation
- Query key constants for all resources
- Root Makefile with developer workflow targets (`install`, `dev`, `lint`, `test`, `format`, `migrate`)
- Docker Compose configuration with Postgres 16
- GitHub CI workflows for backend (ruff, pytest) and frontend (tsc, eslint, vite build)
- Pre-commit hooks for code quality
- Architecture and engineering documentation in `docs/`
- Claude Code configuration: agents, rules, hooks, and skills in `.claude/`
- Prompt history logging in `PROMPT_HISTORY.md`
- Repository governance files: `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`

---

## [0.1.0] – 2026-03-26

### Added
- Initial repository setup with documented architecture
- Core documentation covering system design, domain rules, API conventions, data modeling, and security posture
- Domain documentation: `docs/domain/feature-voting.md`, `docs/domain/voting-rules.md`
- Architecture documentation: `docs/architecture/system-overview.md`, `docs/architecture/backend-architecture.md`, `docs/architecture/frontend-architecture.md`
- Engineering documentation: API conventions, data modeling, security, React standards, API consumption, state management, UI/UX guidelines, testing strategy

[Unreleased]: https://github.com/placeholder/feature-rank/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/placeholder/feature-rank/releases/tag/v0.1.0
