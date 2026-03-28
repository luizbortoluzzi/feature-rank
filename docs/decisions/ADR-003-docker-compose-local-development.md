# ADR-003: Docker Compose for Local Development Orchestration

## Status

Accepted

## Context

Feature Rank requires three cooperating services to run: a MySQL 8.4 database, a Django backend, and a Vite-served React frontend. Each has its own runtime requirements, startup order dependencies, and configuration.

Without a coordinated local setup, developers would need to:
- install MySQL locally and manage its version
- run the backend and frontend in separate terminal sessions
- manually track environment variables across both services
- handle startup ordering (backend must wait for MySQL to be healthy)

The project needed an approach that made the development environment reproducible, low-friction to start, and consistent across different developer machines.

## Decision

Docker Compose is the primary mechanism for running the development environment. All three services are defined in `docker-compose.yml` at the repository root. A separate `docker-compose.prod.yml` provides production overrides that are applied on top of the base file.

**Development configuration (`docker-compose.yml`):**
- All three services share a dedicated bridge network (`feature_rank_net`) so they can resolve each other by service name
- The MySQL service runs MySQL 8.4, exposes port 3306 to the host for local database inspection, uses a named volume for data persistence, and declares a healthcheck (`mysqladmin ping`)
- The backend depends on `db` with condition `service_healthy`, ensuring migrations never run against an unavailable database
- The frontend depends on `backend` with condition `service_started`
- Both backend and frontend mount their source directories as bind volumes, enabling live reload without container rebuilds
- The frontend additionally uses an anonymous volume at `/app/node_modules` to prevent the host bind mount from shadowing the container's node modules

**Backend startup orchestration (`entrypoint.sh`):**
Rather than relying solely on `depends_on`, the backend entrypoint actively polls the MySQL TCP port using a pure-Python socket check with a 60-second deadline. Once MySQL is reachable, it runs `manage.py migrate` automatically in development (controlled by `DJANGO_ENV=development`). This eliminates the need to manually run migrations after `docker compose up`.

**Production override (`docker-compose.prod.yml`):**
- MySQL's host port exposure is removed (empty `ports: []`)
- The backend replaces `runserver` with Gunicorn (4 workers, 120-second timeout)
- The backend's source bind mount is removed — the container runs from its image content only
- The frontend switches from the `dev` Dockerfile stage to the `runner` stage (nginx serving compiled assets)
- All services have `restart: always`
- The production compose file is applied as an overlay: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build`

## Consequences

**Benefits:**
- The entire development environment starts with a single command (`make up` / `docker compose up -d`), regardless of what is installed on the host machine beyond Docker itself
- MySQL version is pinned to 8.4 in the compose file, eliminating version drift between developers
- The bind-mount hot-reload approach means code changes are reflected immediately without rebuilding images
- The `entrypoint.sh` polling loop eliminates a class of race condition bugs where the backend starts before the database accepts connections
- Automatic migration on startup means the database schema is always up to date after `make up`
- The overlay pattern (`docker-compose.prod.yml`) keeps production differences explicit and reviewable without duplicating the full service definition

**Trade-offs:**
- Developers still need Docker installed; the fully containerized path does not support environments where Docker is unavailable (e.g., some locked-down CI runners or Windows without WSL2)
- The anonymous `node_modules` volume means `npm install` must be re-run inside the container when dependencies change — the Makefile's `install-frontend` target handles this
- Automatic migration in development is convenient but means migrations run on every `docker compose up` restart, which is slightly slower than an explicit manual step

## Alternatives Considered

**Manual local installation (no Docker):** Each developer installs MySQL, Python, and Node directly. Eliminates Docker as a prerequisite but creates version inconsistency across machines and requires significant setup documentation. The Makefile's `dev`, `dev-backend`, and `dev-frontend` targets support this path for developers who prefer it.

**Docker Compose with a single compose file for all environments:** Simpler to read but requires environment-specific values to be expressed as conditionals within the same file, which becomes harder to maintain. The overlay pattern keeps base and production concerns separated.

**Kubernetes / Helm for local development:** Adds significant complexity for a three-service application with no current multi-replica requirement. Not warranted.

**Using `wait-for-it.sh` or `dockerize`:** The entrypoint uses a pure-Python socket polling loop instead of shell utilities, avoiding the need to install additional tools in the backend image. The Python standard library `socket` module is always available.

## Evidence

- `docker-compose.yml` — full development service definitions with healthchecks, depends_on conditions, bind mounts, and anonymous node_modules volume
- `docker-compose.prod.yml` — production overlay: removes ports, removes bind mounts, switches to gunicorn and nginx runner stages, adds `restart: always`
- `backend/entrypoint.sh` — Python socket polling loop, conditional `manage.py migrate`, `exec "$@"` for signal passthrough
- `backend/Dockerfile` — multi-stage build (builder + runtime); CMD defaults to `runserver`, overridden by prod compose to gunicorn
- `frontend/Dockerfile` — four-stage build: `deps`, `builder`, `runner` (nginx), `dev` (Vite); compose targets `dev` for development and `runner` for production
- `docker/nginx/` — nginx configuration files mounted into the frontend runner container
- `docker/mysql/01-grant-test-db.sh` — MySQL init script that creates the test database, run once by the MySQL entrypoint on first data volume initialization
- `Makefile` — `up`, `down`, `logs`, `restart`, `ps`, `migrate`, `seed`, `seed-demo` targets all delegate to `docker compose exec` or `docker compose` commands
