# doctrs Backend (Sabina)

Production-ready FastAPI backend for therapist/doctor directory and booking.

## Stack
- FastAPI + Pydantic v2
- PostgreSQL + SQLAlchemy 2.0
- Alembic migrations
- JWT auth with roles: `ADMIN`, `DOCTOR`, `USER`
- Pytest integration tests
- Docker Compose (`app`, `postgres`, `postgres_test`)

## Project Structure
```text
backend/
  app/
    main.py
    core/
    db/
    schemas/
    services/
    api/routes/
  alembic/
  tests/
  docker-compose.yml
  Dockerfile
  Makefile
```

## Seeded Admin
Seeded automatically on API startup:
- email: `admin@sabina.local`
- password: `Admin12345!`

## Run Locally (Docker)
```bash
cd backend
docker compose up --build
```

API:
- `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Migrations
```bash
cd backend
alembic upgrade head
```

or:
```bash
make migrate
```

## Local Dev (without Docker app container)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='postgresql+psycopg://postgres:postgres@localhost:5432/doctrs'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Tests
A separate test DB is expected (`postgres_test` service at port `5433`).

Start DBs:
```bash
cd backend
docker compose up -d postgres postgres_test
```

Run tests:
```bash
cd backend
TEST_DATABASE_URL='postgresql+psycopg://postgres:postgres@localhost:5433/doctrs_test' make test
```

## Make Commands
```bash
make install
make run
make migrate
make makemigration
make test
make lint
```

## Business Behavior Implemented
- Public doctors require: approved application + profile `is_public=true` + user `ACTIVE`
- Doctor application is private and separate from public profile
- Admin approval creates/updates public profile and adds `VERIFIED_DOCTOR`
- Document upload supports `pdf/jpg/png` up to 10MB (stored on disk, URL in DB)
- Availability based on weekly rules + date exceptions
- Booking request validates slot/rules/exceptions/doctor state
- Confirm performs strict overlap conflict check in DB transaction with advisory lock

## Example cURL

### Auth
```bash
curl -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@sabina.local","password":"User12345!","role":"USER"}'

curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@sabina.local","password":"User12345!"}'

curl http://localhost:8000/auth/me -H "Authorization: Bearer $USER_TOKEN"
```

### Doctor
```bash
curl http://localhost:8000/doctor/application -H "Authorization: Bearer $DOCTOR_TOKEN"

curl -X POST http://localhost:8000/doctor/application/save \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '{"display_name":"Dr Sabina","specialties":["CBT"],"languages":["Arabic"],"session_types":["VIDEO"],"pricing_per_session":"75.00"}'

curl -X POST http://localhost:8000/doctor/application/submit \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

curl -X POST http://localhost:8000/doctor/documents/upload \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -F "type=LICENSE" \
  -F "file=@/path/to/license.pdf"

curl -X GET http://localhost:8000/doctor/documents \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

curl -X POST http://localhost:8000/doctor/availability/rules \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '[{"day_of_week":0,"start_time":"09:00:00","end_time":"12:00:00","timezone":"Asia/Amman","slot_duration_minutes":50,"buffer_minutes":10}]'

curl -X POST http://localhost:8000/doctor/availability/exceptions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '[{"date":"2026-03-03","is_unavailable":true}]'

curl -X GET http://localhost:8000/doctor/appointments \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

curl -X POST http://localhost:8000/doctor/appointments/$APPOINTMENT_ID/confirm \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

curl -X POST http://localhost:8000/doctor/appointments/$APPOINTMENT_ID/cancel \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

### Admin
```bash
curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@sabina.local","password":"Admin12345!"}'

curl http://localhost:8000/admin/applications?status=SUBMITTED \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl http://localhost:8000/admin/applications/$APP_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST http://localhost:8000/admin/applications/$APP_ID/review-start \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST http://localhost:8000/admin/applications/$APP_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST http://localhost:8000/admin/applications/$APP_ID/reject \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason":"Insufficient verification"}'

curl -X POST http://localhost:8000/admin/applications/$APP_ID/request-changes \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"notes":"Please clarify license authority."}'

curl -X POST http://localhost:8000/admin/documents/$DOC_ID/set-status \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"ACCEPTED","comment":"Verified"}'

curl -X POST http://localhost:8000/admin/doctors/$DOCTOR_USER_ID/toggle-public \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"is_public":false}'

curl -X POST http://localhost:8000/admin/doctors/$DOCTOR_USER_ID/update-pricing \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"currency":"JOD","per_session":"90.00","notes":"Updated by admin"}'
```

### Public / User Booking
```bash
curl http://localhost:8000/doctors
curl "http://localhost:8000/doctors?specialty=CBT&min_price=50&max_price=100&city=Amman&session_type=VIDEO"

curl http://localhost:8000/doctors/$DOCTOR_USER_ID

curl "http://localhost:8000/doctors/$DOCTOR_USER_ID/availability?date_from=2026-03-01&date_to=2026-03-07"

curl -X POST http://localhost:8000/appointments/request \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"doctor_user_id":"'$DOCTOR_USER_ID'","start_at":"2026-03-02T06:00:00Z","timezone":"Asia/Amman"}'

curl http://localhost:8000/appointments/my -H "Authorization: Bearer $USER_TOKEN"

curl -X POST http://localhost:8000/appointments/$APPOINTMENT_ID/cancel \
  -H "Authorization: Bearer $USER_TOKEN"
```

## Notes
- OpenAPI is auto-generated by FastAPI at `/docs` and `/openapi.json`.
- For production, rotate `JWT_SECRET_KEY`, lock CORS, and use object storage (S3/MinIO) for documents.
