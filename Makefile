# ─────────────────────────────────────────────────────────────────────────────
# feature-rank — Makefile
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help \
        install install-backend install-frontend \
        setup-env \
        up down clear logs restart ps \
        dev dev-backend dev-frontend \
        migrate makemigrations shell \
        seed seed-demo demo \
        lint lint-backend lint-frontend \
        format format-backend \
        fix fix-backend \
        test test-backend test-frontend \
        test-backend-coverage check-backend-coverage \
        pre-commit-install pre-commit-run \
        prod-up prod-down prod-logs prod-ps prod-restart prod-build \
        prod-deploy prod-seed prod-seed-demo prod-create-dump prod-reset-db

# ── Default ───────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  feature-rank — available targets"
	@echo ""
	@echo "  Setup"
	@echo "    install           Install all dependencies (backend + frontend)"
	@echo "    install-backend   Install Python dependencies"
	@echo "    install-frontend  Install Node dependencies"
	@echo "    setup-env         Generate .env and frontend/.env with random secrets (skips if files exist)"
	@echo ""
	@echo "  Docker (development)"
	@echo "    up                Start all services (detached)"
	@echo "    down              Stop all services"
	@echo "    clear             Stop services, delete volumes and locally-built images (full reset)"
	@echo "    logs              Tail logs for all services"
	@echo "    restart           Restart all services"
	@echo "    ps                Show running service status"
	@echo ""
	@echo "  Development"
	@echo "    dev               Start backend + frontend concurrently"
	@echo "    dev-backend       Start Django dev server"
	@echo "    dev-frontend      Start Vite dev server"
	@echo ""
	@echo "  Database"
	@echo "    migrate           Apply pending migrations"
	@echo "    makemigrations    Generate new migrations"
	@echo "    shell             Open Django shell inside the container"
	@echo "    seed              Seed reference data (categories + statuses)"
	@echo "    seed-demo         Seed full demo dataset (users, features, votes)"
	@echo "    demo              Full setup: generate env files, build and start services, migrate, seed"
	@echo ""
	@echo "  Production (OCI) — requires .env.prod"
	@echo "    prod-up           Start production stack (docker-compose.prod.yml)"
	@echo "    prod-down         Stop production stack"
	@echo "    prod-restart      Restart production stack"
	@echo "    prod-build        Build production images without starting"
	@echo "    prod-logs         Tail production logs"
	@echo "    prod-ps           Show production service status"
	@echo "    prod-deploy       Pull latest code, rebuild, and restart (full deploy)"
	@echo "    prod-seed         Seed reference data in production"
	@echo "    prod-seed-demo    Seed demo dataset in production"
	@echo "    prod-create-dump  Create seed dump from running production database"
	@echo "    prod-reset-db     Reset production database to seed state (manual trigger)"
	@echo ""
	@echo "  Code quality"
	@echo "    lint              Lint backend + frontend"
	@echo "    lint-backend      Run ruff on the backend"
	@echo "    lint-frontend     Run ESLint on the frontend"
	@echo "    format            Format backend + frontend code"
	@echo "    format-backend    Run black + ruff format on the backend"
	@echo "    fix               Auto-fix lint issues in backend + frontend"
	@echo "    fix-backend       Run ruff --fix + black on the backend"
	@echo ""
	@echo "  Testing"
	@echo "    test                     Run all tests (backend + frontend)"
	@echo "    test-backend             Run backend tests with pytest"
	@echo "    test-frontend            Run frontend tests with vitest"
	@echo "    test-backend-coverage    Run backend tests with coverage report"
	@echo "    check-backend-coverage   Run backend tests and fail if coverage < 80%"
	@echo ""
	@echo "  Pre-commit"
	@echo "    pre-commit-install  Install pre-commit hooks into .git/hooks"
	@echo "    pre-commit-run      Run all hooks against all files"
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	cd backend && pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

# Generate .env files with random secrets.
# Idempotent: skips any file that already exists.
# Requires: openssl (passwords), python3 (Django secret key fallback: openssl hex).
setup-env:
	@if [ ! -f .env ]; then \
		echo "  Generating .env with random secrets..."; \
		MYSQL_PASS=$$(openssl rand -hex 20); \
		MYSQL_ROOT_PASS=$$(openssl rand -hex 20); \
		DJANGO_KEY=$$(python3 -c \
			"import secrets, string; c = string.ascii_letters + string.digits + '!@#%^&*(-_=+)'; print(''.join(secrets.choice(c) for _ in range(50)))" \
			2>/dev/null || openssl rand -hex 25); \
		printf 'MYSQL_DATABASE=feature_rank\n' > .env; \
		printf 'MYSQL_USER=feature_rank_user\n' >> .env; \
		printf 'MYSQL_PASSWORD=%s\n' "$$MYSQL_PASS" >> .env; \
		printf 'MYSQL_ROOT_PASSWORD=%s\n' "$$MYSQL_ROOT_PASS" >> .env; \
		printf 'DJANGO_SECRET_KEY=%s\n' "$$DJANGO_KEY" >> .env; \
		printf 'DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1\n' >> .env; \
		printf 'CORS_ALLOWED_ORIGINS=http://localhost:5173\n' >> .env; \
		printf 'VITE_API_BASE_URL=http://localhost:8000\n' >> .env; \
		echo "  .env created"; \
	else \
		echo "  .env already exists — skipping"; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "  Generating frontend/.env..."; \
		cp frontend/.env.example frontend/.env; \
		echo "  frontend/.env created"; \
	else \
		echo "  frontend/.env already exists — skipping"; \
	fi

# ── Docker ────────────────────────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

clear:
	docker compose down -v --rmi local

logs:
	docker compose logs -f

restart:
	docker compose restart

ps:
	docker compose ps

# ── Development ───────────────────────────────────────────────────────────────

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	docker compose exec -T backend python manage.py migrate contenttypes 0001
	docker compose exec -T backend python manage.py migrate contenttypes 0002 --fake
	docker compose exec -T backend python manage.py migrate

makemigrations:
	docker compose exec -T backend python manage.py makemigrations

shell:
	docker compose exec backend python manage.py shell

seed:
	docker compose exec -T backend python manage.py seed_reference_data

seed-demo:
	docker compose exec -T backend python manage.py seed_demo_data

# Full one-command setup for a fresh environment:
#   1. Generate .env files with random secrets (skipped if they already exist)
#   2. Build images and start all services, waiting until health checks pass
#   3. Apply migrations
#   4. Seed reference data (categories, statuses)
#   5. Seed demo dataset (users, features, votes)
#
# Requires Docker Compose v2 (for --wait support).
demo: setup-env
	docker compose up -d --build --wait
	docker compose exec -T backend python manage.py migrate contenttypes 0001
	docker compose exec -T backend python manage.py migrate contenttypes 0002 --fake
	docker compose exec -T backend python manage.py migrate
	docker compose exec -T backend python manage.py seed_reference_data
	docker compose exec -T backend python manage.py seed_demo_data

# ── Production (OCI) ──────────────────────────────────────────────────────────
# All prod-* targets use docker-compose.prod.yml with .env.prod.
# Ensure .env.prod exists before running any of these targets.

PROD_COMPOSE = docker compose -f docker-compose.prod.yml --env-file .env.prod

prod-up:
	docker network create traefik_net 2>/dev/null || true
	$(PROD_COMPOSE) up -d --wait

prod-down:
	$(PROD_COMPOSE) down

prod-restart:
	$(PROD_COMPOSE) restart

prod-build:
	$(PROD_COMPOSE) build --pull

prod-logs:
	$(PROD_COMPOSE) logs -f

prod-ps:
	$(PROD_COMPOSE) ps

prod-deploy:
	./scripts/deploy.sh

prod-seed:
	$(PROD_COMPOSE) exec -T backend python manage.py seed_reference_data

prod-seed-demo:
	$(PROD_COMPOSE) exec -T backend python manage.py seed_demo_data

prod-create-dump:
	./scripts/create-seed-dump.sh

prod-reset-db:
	./scripts/reset-db.sh

# ── Code quality ──────────────────────────────────────────────────────────────

lint: lint-backend lint-frontend

lint-backend:
	cd backend && ruff check .

lint-frontend:
	cd frontend && npm run lint

format: format-backend

format-backend:
	cd backend && black apps/ config/ && ruff format apps/ config/

fix: fix-backend

fix-backend:
	cd backend && ruff check --fix apps/ config/ && black apps/ config/

# ── Testing ───────────────────────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd backend && pytest

test-backend-coverage:
	cd backend && pytest --cov=apps --cov-report=term-missing

check-backend-coverage:
	cd backend && pytest --cov=apps --cov-report=term-missing --cov-fail-under=80

test-frontend:
	cd frontend && npm run test -- --run

# ── Pre-commit ────────────────────────────────────────────────────────────────

pre-commit-install:
	pre-commit install && pre-commit install --hook-type commit-msg

pre-commit-run:
	pre-commit run --all-files
