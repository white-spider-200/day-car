from datetime import datetime, timedelta, timezone
from secrets import randbelow

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, rate_limit_auth, verify_password
from app.db.models import AuthCodeChannel, AuthLoginCode, NotificationChannel, User, UserRole, UserStatus
from app.db.session import get_db
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    RequestLoginCodeRequest,
    RequestLoginCodeResponse,
    TokenResponse,
    VerifyLoginCodeRequest,
)
from app.schemas.users import UserOut
from app.services.notification_service import create_notification

router = APIRouter(prefix="/auth", tags=["auth"])

LOGIN_CODE_EXPIRY_SECONDS = 10 * 60
MAX_CODE_ATTEMPTS = 5


def _generate_numeric_code(length: int = 6) -> str:
    start = 10 ** (length - 1)
    end = (10 ** length) - 1
    return str(randbelow(end - start + 1) + start)


def _find_user_by_identifier(db: Session, *, email: str | None, phone: str | None) -> User | None:
    if email:
        return db.scalar(select(User).where(User.email == email.lower()))
    return db.scalar(select(User).where(User.phone == phone))


def _channel_for_identifier(*, email: str | None, phone: str | None) -> AuthCodeChannel:
    return AuthCodeChannel.EMAIL if email else AuthCodeChannel.SMS


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit_auth(request)

    if payload.role not in {UserRole.USER, UserRole.DOCTOR}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only USER or DOCTOR registration is allowed",
        )

    if payload.email:
        existing_email = db.scalar(select(User).where(User.email == payload.email.lower()))
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if payload.phone:
        existing_phone = db.scalar(select(User).where(User.phone == payload.phone))
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    user = User(
        email=payload.email.lower() if payload.email else None,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit_auth(request)

    user = _find_user_by_identifier(db, email=payload.email, phone=payload.phone)

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token)


@router.post("/request-login-code", response_model=RequestLoginCodeResponse)
def request_login_code(payload: RequestLoginCodeRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit_auth(request)

    user = _find_user_by_identifier(db, email=payload.email, phone=payload.phone)
    delivery_channel = _channel_for_identifier(email=payload.email, phone=payload.phone)

    generic_response = RequestLoginCodeResponse(
        message="If an account exists, a verification code has been sent.",
        delivery_channel=delivery_channel.value,
        expires_in_seconds=LOGIN_CODE_EXPIRY_SECONDS,
    )

    if not user or user.status != UserStatus.ACTIVE:
        return generic_response

    code = _generate_numeric_code()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=LOGIN_CODE_EXPIRY_SECONDS)
    destination = user.email if delivery_channel == AuthCodeChannel.EMAIL else user.phone

    db.execute(
        delete(AuthLoginCode).where(
            AuthLoginCode.user_id == user.id,
            AuthLoginCode.channel == delivery_channel,
            AuthLoginCode.consumed_at.is_(None),
        )
    )

    auth_code = AuthLoginCode(
        user_id=user.id,
        channel=delivery_channel,
        destination=destination or "",
        code_hash=hash_password(code),
        expires_at=expires_at,
    )
    db.add(auth_code)

    body = f"Your Sabina verification code is {code}. It expires in 10 minutes."
    create_notification(
        db,
        user_id=user.id,
        event_type="AUTH_LOGIN_CODE",
        title="Your login verification code",
        body=body,
        channel=NotificationChannel.EMAIL if delivery_channel == AuthCodeChannel.EMAIL else NotificationChannel.SMS,
        metadata_json={"type": "login_code"},
        destination=destination,
    )
    db.commit()

    include_debug_code = (
        (delivery_channel == AuthCodeChannel.EMAIL and not settings.sendgrid_api_key)
        or (
            delivery_channel == AuthCodeChannel.SMS
            and (not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_sms_from)
        )
    )

    return RequestLoginCodeResponse(
        message="Verification code sent.",
        delivery_channel=delivery_channel.value,
        expires_in_seconds=LOGIN_CODE_EXPIRY_SECONDS,
        debug_code=code if include_debug_code else None,
    )


@router.post("/verify-login-code", response_model=TokenResponse)
def verify_login_code(payload: VerifyLoginCodeRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit_auth(request)

    user = _find_user_by_identifier(db, email=payload.email, phone=payload.phone)
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired verification code")

    delivery_channel = _channel_for_identifier(email=payload.email, phone=payload.phone)
    now = datetime.now(timezone.utc)

    code_row = db.scalar(
        select(AuthLoginCode)
        .where(
            AuthLoginCode.user_id == user.id,
            AuthLoginCode.channel == delivery_channel,
            AuthLoginCode.consumed_at.is_(None),
            AuthLoginCode.expires_at >= now,
        )
        .order_by(AuthLoginCode.created_at.desc())
    )
    if not code_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired verification code")

    if not verify_password(payload.code, code_row.code_hash):
        code_row.attempts += 1
        if code_row.attempts >= MAX_CODE_ATTEMPTS:
            code_row.consumed_at = now
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired verification code")

    code_row.consumed_at = now
    db.commit()

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Placeholder for Google OAuth verification logic.
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google login not yet fully implemented")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
