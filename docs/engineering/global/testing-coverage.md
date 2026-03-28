# Backend Test Coverage

## Overview

Backend test coverage is measured with [pytest-cov](https://pytest-cov.readthedocs.io/) (coverage.py under the hood). The minimum enforced threshold is **80% global coverage** across the `apps/` directory.

Coverage is enforced in two places:

1. **Locally** — a pre-commit hook blocks commits when Python files in `backend/` are staged and coverage is below 80%.
2. **CI** — the `backend-tests` job runs `pytest --cov-fail-under=80` and fails the pipeline if the threshold is not met.

---

## Configuration

Coverage settings live in [backend/pyproject.toml](../../../backend/pyproject.toml) under `[tool.coverage.run]` and `[tool.coverage.report]`.

Key settings:

- **Source measured:** `apps/` only. Config modules, manage.py, and migrations are excluded.
- **Omitted paths:** `*/migrations/*`, `*/tests/*`, test files, `conftest.py`, `manage.py`.
- **Threshold:** `fail_under = 80`
- **Report format:** `show_missing = true` — the terminal report highlights uncovered lines.

To change the threshold, update `fail_under` in `[tool.coverage.report]` in `backend/pyproject.toml`. Update this document and the CI comment in `.github/workflows/ci.yml` at the same time.

---

## Developer commands

| Command | What it does |
|---|---|
| `make test-backend` | Run backend tests only, no coverage collection |
| `make test-backend-coverage` | Run tests and print a coverage report (no threshold enforcement) |
| `make check-backend-coverage` | Run tests and fail if coverage is below 80% |

`make test-backend` stays fast and is appropriate for rapid iteration. Use `make test-backend-coverage` when you want to see which lines are uncovered. Use `make check-backend-coverage` to verify compliance before pushing.

---

## Pre-commit hook

The hook `backend-coverage` is defined in [`.pre-commit-config.yaml`](../../../.pre-commit-config.yaml).

It runs automatically on `git commit` **only when at least one Python file inside `backend/` is staged**. Commits that touch only frontend files, docs, or configuration are not affected.

When the hook triggers, it runs:

```
cd backend && pytest --cov=apps --cov-report=term-missing --cov-fail-under=80 -q
```

If coverage is below 80%, the commit is blocked and the terminal shows which lines are uncovered.

### Setup

The hook does not install itself. Run once after cloning the repository:

```bash
make pre-commit-install
```

or equivalently:

```bash
pre-commit install && pre-commit install --hook-type commit-msg
```

---

## What to do when coverage fails

1. Read the `term-missing` report — it shows the exact line ranges not covered.
2. Add tests that exercise the missing paths. Focus on behavior that matters: business rules, permissions, edge cases.
3. If a line is genuinely untestable (e.g., an abstract `__repr__`, a platform guard), add `# pragma: no cover` to that line. Use this sparingly.
4. Re-run `make check-backend-coverage` to confirm the threshold is met before committing.

Do not lower the threshold to make failing commits pass. If the codebase has a legitimate short-term gap, address the gap, not the bar.

---

## Pre-commit vs pre-push tradeoff

The hook runs on **pre-commit** (not pre-push) because:

- The test suite uses an in-memory SQLite database and a fast password hasher (MD5), keeping runtime acceptable for commit-time use.
- Catching coverage regressions earlier (at commit time) is preferable to discovering them at push or CI time.
- The hook is scoped to `^backend/.*\.py$`, so it does not run on frontend-only or doc-only commits.

If the test suite grows significantly slower in the future, consider moving the hook to `stages: [pre-push]` in `.pre-commit-config.yaml`.
