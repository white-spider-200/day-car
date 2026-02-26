.PHONY: install run migrate test lint format

install:
	pip install -r requirements.txt

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

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
