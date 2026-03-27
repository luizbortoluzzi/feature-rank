.PHONY: install install-backend install-frontend dev dev-backend dev-frontend \
        lint lint-backend lint-frontend test test-backend test-frontend \
        format format-backend format-check format-check-backend fix fix-backend \
        backend-seed backend-seed-features seed-demo backend-migrate backend-run frontend-run \
        docker-up docker-down

install: install-backend install-frontend

install-backend:
	cd backend && pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

dev-backend:
	cd backend && python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

dev:
	make -j2 dev-backend dev-frontend

lint-backend:
	cd backend && ruff check .

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend

format-backend:
	cd backend && black apps/ config/ && ruff format apps/ config/

format: format-backend

format-check-backend:
	cd backend && black --check apps/ config/ && ruff format --check apps/ config/

format-check: format-check-backend

fix-backend:
	cd backend && ruff check --fix apps/ config/ && black apps/ config/

fix: fix-backend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm run test -- --run

test: test-backend test-frontend

backend-seed:
	docker compose exec -T backend python manage.py seed_reference_data

backend-seed-features:
	docker compose exec -T backend python manage.py seed_features

seed-demo:
	docker compose exec -T backend python manage.py seed_demo_data

backend-migrate:
	cd backend && python manage.py migrate

backend-run:
	cd backend && python manage.py runserver

frontend-run:
	cd frontend && npm run dev

docker-up:
	docker compose up -d

docker-down:
	docker compose down
