# Support

This document explains how to get help, report bugs, and request features.

---

## Where to Ask Questions

**GitHub Discussions** is the primary place for questions:

- Usage questions ("How do I run the backend with a custom database URL?")
- Architecture questions ("Why is `rate` excluded from ranking?")
- Clarification on documented behavior

Before posting, check the `docs/` directory. Most questions about system behavior, API contracts, and architecture decisions are answered there:

- `docs/architecture/system-overview.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/backend/api-conventions.md`

---

## Reporting Bugs

Open a GitHub Issue and include:

- A clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant environment details (Python version, Node version, OS)

For security vulnerabilities, do **not** open a public issue. See [SECURITY.md](SECURITY.md) for the private reporting process.

---

## Feature Requests

Open a GitHub Issue with the label `enhancement`.

Include:
- The use case you are trying to address
- What behavior you expect
- Why the current behavior is insufficient

Feature requests are evaluated against the documented architecture and domain rules. A request that contradicts a documented invariant (e.g., client-side ranking, anonymous voting) will not be accepted without a documented architecture change first.

---

## Support vs Feature Request

| Type | Description | Channel |
|------|-------------|---------|
| Bug | The system behaves differently from its documented contract | GitHub Issue |
| Usage question | How to run, configure, or use the system | GitHub Discussions |
| Architecture question | Why something was designed a specific way | GitHub Discussions |
| Feature request | New behavior not currently in scope | GitHub Issue (enhancement) |
| Security vulnerability | A potential vulnerability in the system | See SECURITY.md |

---

## Response Model

This project is maintained on a best-effort basis.

- Issues and discussions are reviewed regularly but there are no guaranteed response times.
- Critical bugs and security reports receive priority attention.
- Feature requests are considered based on alignment with the project's documented scope and design.

If you need guaranteed support or SLA-based response times, this open-source project does not provide that. Commercial support arrangements are outside the scope of this repository.

---

## Contributing Fixes

If you encounter a bug and know how to fix it, contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit a pull request.
