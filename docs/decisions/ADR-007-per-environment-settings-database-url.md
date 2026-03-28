# ADR-007: Per-Environment Django Settings with URL-Based Database Configuration

## Status

Accepted

## Context

Django projects require different configuration values across development, testing, and production environments. Common differences include debug mode, allowed hosts, CORS policy, database engine, security headers, static file handling, and logging verbosity.

The naive approach — a single `settings.py` with environment variable conditionals — works for small projects but becomes brittle as the number of environment-specific overrides grows. Every environment's concerns leak into a single file, making it harder to audit what is active in any given context.

The project also needed a way to configure the database connection that works uniformly across Docker Compose (where the database host is a service name like `db`) and CI (where SQLite in-memory is used) without duplicating connection configuration logic.

## Decision

Settings are split into four files under `backend/config/settings/`:

- **`base.py`** — shared configuration that applies in all environments: installed apps, middleware, authentication classes, JWT configuration, REST framework defaults, custom renderer and exception handler, and the database connection parsed from `DATABASE_URL`
- **`development.py`** — imports `base` and overrides: `DEBUG = True`, `CORS_ALLOW_ALL_ORIGINS = True`, SQL query echo logging to the console
- **`production.py`** — imports `base` and overrides: `DEBUG = False`, security headers (`X-Frame-Options: DENY`, `SECURE_CONTENT_TYPE_NOSNIFF`, HSTS for one year), secure cookie flags, WhiteNoise middleware and static storage, `SECURE_PROXY_SSL_HEADER` for load-balancer HTTPS detection
- **`test.py`** — imports `base` and overrides: SQLite in-memory database, `CORS_ALLOW_ALL_ORIGINS = True`, MD5 password hasher for speed

The active settings module is selected via the `DJANGO_SETTINGS_MODULE` environment variable, set in Docker Compose, CI, and the test runner configuration.

**Database URL configuration:**
All environments configure the database through a single `DATABASE_URL` environment variable, parsed by `dj_database_url`. This means:
- In development (Docker Compose): `DATABASE_URL=mysql://user:pass@db:3306/feature_rank`
- In CI / tests: the test settings override `DATABASES` directly with an in-memory SQLite definition, so no MySQL service is required
- In production: `DATABASE_URL` is set in the deployment environment without any code change

`python-decouple` (`config()`) is used to read all environment variables with type casting and default fallback, avoiding raw `os.environ.get()` calls throughout settings files.

## Consequences

**Benefits:**
- Each environment's settings are self-contained and easy to audit in isolation. `production.py` contains only security-relevant overrides; `development.py` contains only developer-convenience overrides.
- Adding a new environment-specific setting does not require touching files for other environments.
- The test environment uses SQLite in-memory, which requires no external service in CI and runs significantly faster than MySQL. The production database engine is validated in integration tests run against the actual Docker Compose stack.
- The `DATABASE_URL` convention is portable — the same Django code works with MySQL in production and SQLite in tests without engine-specific configuration blocks.
- `conn_max_age=600` is set in `dj_database_url.config()`, enabling persistent database connections across gunicorn workers without requiring a separate connection pool.

**Trade-offs:**
- The `test.py` settings use SQLite, which has a different SQL dialect and constraint enforcement behavior than MySQL. Tests that depend on MySQL-specific behavior (e.g., exact `IntegrityError` behavior for concurrent unique constraint violations) cannot be fully validated in the CI test suite.
- Developers must ensure `DJANGO_SETTINGS_MODULE` is set correctly. Misconfiguration (e.g., accidentally running with production settings in development) could cause unexpected behavior. Docker Compose sets this explicitly per service.
- `python-decouple` is an additional dependency over raw `os.environ`, but provides cleaner type casting and default handling.

## Alternatives Considered

**Single `settings.py` with `if DEBUG:` conditionals:** Common in tutorials, fragile in practice. All environment concerns are mixed into one file. Production-only settings can accidentally activate in development if the conditional is wrong.

**Environment variables for every setting (12-factor style):** Every setting is an environment variable, no Python-level layering. Maximally flexible but requires a very large `.env` file and makes it hard to see what applies in a given environment without inspecting every variable.

**Django-environ instead of dj-database-url + python-decouple:** `django-environ` combines URL parsing and environment variable reading in one library. The project uses `dj-database-url` and `python-decouple` separately, which is more explicit about each library's role.

## Evidence

- `backend/config/settings/base.py` — `dj_database_url.config(default=config("DATABASE_URL", ...))`, `SIMPLE_JWT` block, `REST_FRAMEWORK` defaults, custom renderer and exception handler
- `backend/config/settings/development.py` — `DEBUG = True`, `CORS_ALLOW_ALL_ORIGINS = True`, SQL logging config
- `backend/config/settings/production.py` — security headers, HSTS, WhiteNoise, `SECURE_PROXY_SSL_HEADER`, no debug
- `backend/config/settings/test.py` — SQLite in-memory override, MD5 password hasher; docstring: *"uses SQLite in-memory to avoid MySQL driver requirement"*
- `docker-compose.yml` — backend service sets `DJANGO_SETTINGS_MODULE: config.settings.development`, `DATABASE_URL` constructed from compose variables
- `docker-compose.prod.yml` — overrides `DJANGO_SETTINGS_MODULE: config.settings.production`
- `backend/pyproject.toml` — `[tool.pytest.ini_options]` sets `DJANGO_SETTINGS_MODULE = "config.settings.test"`
- `.github/workflows/ci.yml` — backend test job uses no `DJANGO_SETTINGS_MODULE` override; relies on `pyproject.toml` pytest config which selects `test.py`
- `.env.example` — documents required environment variables with placeholder values
