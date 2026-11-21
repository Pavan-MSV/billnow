"""Authentication routes: register, login, refresh, password reset, me, logout."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import func, select

import jwt

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.logging import get_logger
from app.core.ratelimit import limiter
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserOut
from app.services.email import send_password_reset_email
from app.services.notifications import get_or_create_preferences

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


def _issue_tokens(user: User) -> TokenPair:
    subject = str(user.id)
    return TokenPair(
        access_token=create_access_token(subject, user.token_version),
        refresh_token=create_refresh_token(subject, user.token_version),
    )


def _user_from_subject(db: DbSession, subject: str | None) -> User | None:
    """Resolve a ``sub`` claim to a user, tolerating malformed subjects."""
    if not subject:
        return None
    try:
        user_id = uuid.UUID(subject)
    except (ValueError, TypeError):
        return None
    return db.get(User, user_id)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: DbSession) -> TokenResponse:
    email = payload.email.lower()

    existing = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        account_type=payload.account_type.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    get_or_create_preferences(db, user)

    tokens = _issue_tokens(user)
    return TokenResponse(user=UserOut.model_validate(user), **tokens.model_dump())


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, payload: LoginRequest, db: DbSession) -> TokenResponse:
    email = payload.email.lower()
    user = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        # Same message for unknown email and bad password (no account enumeration).
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is disabled.")

    tokens = _issue_tokens(user)
    return TokenResponse(user=UserOut.model_validate(user), **tokens.model_dump())


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    try:
        claims = decode_token(payload.refresh_token)
    except jwt.PyJWTError as exc:
        raise invalid from exc

    if claims.get("type") != "refresh":
        raise invalid

    try:
        user_id = UUID(str(claims.get("sub")))
    except (ValueError, TypeError) as exc:
        raise invalid from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active or int(claims.get("ver", 0)) != user.token_version:
        raise invalid

    return _issue_tokens(user)


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: DbSession) -> MessageResponse:
    email = payload.email.lower()
    user = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()

    if user is not None:
        token = create_password_reset_token(str(user.id))
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link)

    # Always return the same response so email addresses cannot be enumerated.
    return MessageResponse(
        message="If an account exists for that email, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: DbSession) -> MessageResponse:
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This password reset link is invalid or has expired.",
    )
    try:
        claims = decode_token(payload.token)
    except jwt.PyJWTError as exc:
        raise invalid from exc

    if claims.get("type") != "reset":
        raise invalid

    try:
        user_id = UUID(str(claims.get("sub")))
    except (ValueError, TypeError) as exc:
        raise invalid from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise invalid

    user.password_hash = hash_password(payload.new_password)
    # Invalidate any previously issued access/refresh tokens.
    user.token_version += 1
    db.commit()

    return MessageResponse(message="Your password has been reset. You can now sign in.")


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: CurrentUser) -> MessageResponse:
    # Stateless JWT: the client simply discards its tokens.
    return MessageResponse(message="Signed out.")


@router.post("/logout-all", response_model=MessageResponse)
def logout_all(current_user: CurrentUser, db: DbSession) -> MessageResponse:
    current_user.token_version += 1
    db.commit()
    return MessageResponse(message="Signed out from all sessions.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Your current password is incorrect."
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.token_version += 1
    db.commit()
    return MessageResponse(message="Password updated successfully.")
