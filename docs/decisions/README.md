# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for Feature Rank.

Each ADR documents a significant engineering or architectural decision: the context that made it necessary, what was decided, the consequences and trade-offs, alternatives that were considered, and the repository evidence that supports it.

ADRs are append-only. Superseded decisions are marked as such rather than deleted.

---

## Index

| ADR | Title | Status |
|---|---|---|
| [ADR-001](ADR-001-monorepo-structure.md) | Monorepo Structure | Accepted |
| [ADR-002](ADR-002-voting-model.md) | Equal-Weight Vote-Count Ranking Model | Accepted |
| [ADR-003](ADR-003-docker-compose-local-development.md) | Docker Compose for Local Development Orchestration | Accepted |
| [ADR-004](ADR-004-backend-layered-architecture.md) | Backend Layered Architecture (Views / Services / Selectors) | Accepted |
| [ADR-005](ADR-005-frontend-pure-api-consumer.md) | Frontend as a Pure API Consumer | Accepted |
| [ADR-006](ADR-006-jwt-authentication-refresh-rotation.md) | JWT Authentication with Rotating Refresh Tokens | Accepted |
| [ADR-007](ADR-007-per-environment-settings-database-url.md) | Per-Environment Django Settings with URL-Based Database Configuration | Accepted |
| [ADR-008](ADR-008-reference-data-seeded-controlled-entities.md) | Reference Data as Admin-Controlled Seeded Entities | Accepted |
| [ADR-009](ADR-009-ci-pipeline-design.md) | GitHub Actions CI Pipeline Design | Accepted |
| [ADR-010](ADR-010-makefile-developer-workflow-interface.md) | Makefile as the Unified Developer Workflow Interface | Accepted |

---

## Format

Each ADR uses the following structure:

- **Status** — current state of the decision (Accepted, Superseded, Deprecated)
- **Context** — the problem or situation that required a decision
- **Decision** — what was decided
- **Consequences** — trade-offs, benefits, and drawbacks
- **Alternatives Considered** — realistic alternatives and why they were not chosen
- **Evidence** — specific files, patterns, or configuration in the repository that demonstrates the decision is in effect
