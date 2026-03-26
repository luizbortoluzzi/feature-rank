.PHONY: install install-backend install-frontend dev dev-backend dev-frontend \
        lint lint-backend lint-frontend test test-backend test-frontend \
        format format-backend backend-migrate backend-run frontend-run \
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
	cd backend && ruff format .

format: format-backend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm run test -- --run

test: test-backend test-frontend

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
