from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    rate_limit_auth,
    verify_password,
)
from app.db.models import User, UserRole, UserStatus
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, GoogleLoginRequest
from app.schemas.users import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


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

    if payload.email:
        user = db.scalar(select(User).where(User.email == payload.email.lower()))
    else:
        user = db.scalar(select(User).where(User.phone == payload.phone))

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Placeholder for Google OAuth verification logic
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google login not yet fully implemented")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
