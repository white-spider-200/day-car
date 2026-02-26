.PHONY: install run migrate test lint format db-up db-down db-reset seed-local run-local setup-local

install:
	pip install -r requirements.txt

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

db-up:
	docker compose up -d postgres

db-down:
	docker compose stop postgres

db-reset:
	docker compose down -v postgres
	docker compose up -d postgres

seed-local:
	docker compose exec -T postgres psql -U postgres -d doctrs < sql/user_doctor_admin_schema.sql
	docker compose exec -T postgres psql -U postgres -d doctrs < sql/seed_user_doctor_admin.sql

setup-local:
	python3 -m venv .venv
	. .venv/bin/activate && \
	PY314_PLUS=$$(python -c 'import sys; print(int(sys.version_info >= (3, 14)))') && \
	if [ "$$PY314_PLUS" = "1" ]; then \
		echo "Detected Python 3.14+; enabling PyO3 ABI3 forward compatibility for pydantic-core build."; \
		PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 pip install -r requirements.txt; \
	else \
		pip install -r requirements.txt; \
	fi

run-local:
	DATABASE_URL=$${DATABASE_URL:-postgresql+psycopg://postgres:postgres@localhost:5432/doctrs} \
	JWT_SECRET_KEY=$${JWT_SECRET_KEY:-super-secret-change-me} \
	SEED_ADMIN_EMAIL=$${SEED_ADMIN_EMAIL:-admin@sabina.local} \
	SEED_ADMIN_PASSWORD=$${SEED_ADMIN_PASSWORD:-Admin12345!} \
	. .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	alembic upgrade head

makemigration:
	alembic revision --autogenerate -m "update"

test:
	TEST_DATABASE_URL=$${TEST_DATABASE_URL:-postgresql+psycopg://postgres:postgres@localhost:5433/doctrs_test} \
	DATABASE_URL=$${TEST_DATABASE_URL} \
	pytest -q

lint:
	ruff check app tests

format:
	ruff check --fix app tests
