# ─────────────────────────────────────────────────────────────────────────────
# feature-rank — Makefile
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help \
        install install-backend install-frontend \
        up down clear logs restart ps \
        dev dev-backend dev-frontend \
        migrate makemigrations shell \
        seed seed-demo demo \
        lint lint-backend lint-frontend \
        format format-backend \
        fix fix-backend \
        test test-backend test-frontend \
        pre-commit-install pre-commit-run

# ── Default ───────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  feature-rank — available targets"
	@echo ""
	@echo "  Setup"
	@echo "    install           Install all dependencies (backend + frontend)"
	@echo "    install-backend   Install Python dependencies"
	@echo "    install-frontend  Install Node dependencies"
	@echo ""
	@echo "  Docker"
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
	@echo "    demo              Start the app and run all seeds (reference + demo)"
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
	@echo "    test              Run all tests (backend + frontend)"
	@echo "    test-backend      Run backend tests with pytest"
	@echo "    test-frontend     Run frontend tests with vitest"
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

demo:
	docker compose up -d
	docker compose exec -T backend python manage.py migrate contenttypes 0001
	docker compose exec -T backend python manage.py migrate contenttypes 0002 --fake
	docker compose exec -T backend python manage.py migrate
	docker compose exec -T backend python manage.py seed_reference_data
	docker compose exec -T backend python manage.py seed_demo_data

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

test-frontend:
	cd frontend && npm run test -- --run

# ── Pre-commit ────────────────────────────────────────────────────────────────

pre-commit-install:
	pre-commit install && pre-commit install --hook-type commit-msg

pre-commit-run:
	pre-commit run --all-files
