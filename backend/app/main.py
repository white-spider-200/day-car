import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.api.routes import (
    admin_reports,
    admin,
    auth,
    complaints,
    doctor,
    doctor_applications_public,
    ehr,
    matching,
    messages,
    notifications,
    payments,
    prescriptions,
    posts,
    profile_updates,
    public_doctors,
    referrals,
    treatment_requests,
    user_appointments,
    vr_sessions,
)
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import User, UserRole, UserStatus
from app.db.session import SessionLocal, engine
from app.services.notification_realtime import notification_realtime_hub
from app.services.storage_service import ensure_upload_dir

app = FastAPI(title="doctrs API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(public_doctors.router)
app.include_router(matching.router)
app.include_router(doctor_applications_public.router)
app.include_router(doctor.router)
app.include_router(user_appointments.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(prescriptions.router)
app.include_router(treatment_requests.router)
app.include_router(ehr.router)
app.include_router(referrals.router)
app.include_router(posts.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(admin_reports.router)
app.include_router(profile_updates.router)
app.include_router(vr_sessions.router)

ensure_upload_dir()
app.mount(settings.upload_base_url, StaticFiles(directory=settings.upload_dir), name="uploads")


@app.on_event("startup")
async def init_realtime_hub() -> None:
    notification_realtime_hub.attach_loop(asyncio.get_running_loop())


@app.on_event("startup")
def seed_admin_user() -> None:
    # Local-dev safety: ensure tables exist before auth endpoints are used.
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        try:
            admin = db.scalar(select(User).where(User.email == settings.seed_admin_email))
            if admin:
                return
            admin = User(
                email=settings.seed_admin_email,
                password_hash=hash_password(settings.seed_admin_password),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
            db.add(admin)
            db.commit()
        except (ProgrammingError, OperationalError):
            db.rollback()


@app.get("/health", tags=["public"])
def health():
    return {"status": "ok"}
