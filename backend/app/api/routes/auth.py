"""Authentication routes: register, login, refresh, password reset, me, logout."""

import secrets
import time
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select

import jwt

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.logging import get_logger
from app.core.ratelimit import limiter
from app.core.security import (
    create_access_token,
    create_account_deletion_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.product import Product
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    OtpResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    TokenPair,
    TokenResponse,
    VerifyOtpRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserOut
from app.services.email import (
    send_account_deletion_email,
    send_otp_email,
    send_password_reset_email,
)
from app.services.notifications import get_or_create_preferences
from app.services.sms import send_otp_sms
from app.services.storage import get_storage

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)

# Temporary in-memory OTP verification store: email -> {otp, phone, expires_at, verified, attempts}
_otp_cache: dict[str, dict] = {}


def _cleanup_expired_otps() -> None:
    """Prune expired OTP entries to prevent memory buildup."""
    now = time.time()
    expired = [email for email, data in _otp_cache.items() if now > data.get("expires_at", 0)]
    for email in expired:
        _otp_cache.pop(email, None)


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
        user_id = UUID(subject)
    except (ValueError, TypeError):
        return None
    return db.get(User, user_id)


@router.post("/send-otp", response_model=OtpResponse)
@limiter.limit("10/minute")
def send_otp(request: Request, payload: SendOtpRequest, db: DbSession) -> OtpResponse:
    _cleanup_expired_otps()
    email = payload.email.lower()
    channel = payload.channel.lower()

    # Check if email is already taken
    existing = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Generate 6-digit OTP
    otp = f"{secrets.randbelow(900000) + 100000}"
    _otp_cache[email] = {
        "otp": otp,
        "phone": payload.phone,
        "channel": channel,
        "expires_at": time.time() + 600,
        "verified": False,
        "attempts": 0,
    }

    if channel == "sms":
        if not settings.SMS_ENABLED:
            logger.info("SMS request received but SMS_ENABLED is False (phone=%s)", payload.phone)
            if settings.is_production:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SMS delivery is not configured on the server yet. Please select Email verification.",
                )
        else:
            sent = send_otp_sms(payload.phone, otp)
            if not sent:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to send SMS to your mobile number. Please check the number or choose Email verification.",
                )
        message = f"Verification code sent via SMS to {payload.phone}."
    else:
        # Email channel
        if settings.EMAIL_ENABLED:
            sent = send_otp_email(payload.email, otp)
            if not sent:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to deliver verification email. Please check your email address or try again.",
                )
        else:
            logger.info("Email request received but EMAIL_ENABLED is False (email=%s)", email)
            if settings.is_production:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email delivery is not configured on the server. Please contact support or configure SMTP.",
                )
            # In test/development, invoke handler for coverage/logging
            send_otp_email(payload.email, otp)
        message = f"Verification code sent to {payload.email}."

    logger.info("Verification code generated for email=%s, phone=%s, channel=%s", email, payload.phone, channel)

    return OtpResponse(
        message=message,
        channel=channel,
        dev_otp=otp if settings.ENVIRONMENT == "test" else None,
        expires_in=600,
    )


@router.post("/verify-otp", response_model=MessageResponse)
@limiter.limit("20/minute")
def verify_otp(request: Request, payload: VerifyOtpRequest) -> MessageResponse:
    _cleanup_expired_otps()
    email = payload.email.lower()
    stored = _otp_cache.get(email)

    if not stored or time.time() > stored["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired or does not exist. Please request a new code.",
        )

    if stored.get("attempts", 0) >= 3:
        _otp_cache.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many invalid attempts. This verification code has been revoked. Please request a new code.",
        )

    if stored["otp"] != payload.otp.strip():
        stored["attempts"] = stored.get("attempts", 0) + 1
        remaining = 3 - stored["attempts"]
        if remaining <= 0:
            _otp_cache.pop(email, None)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid attempts. This verification code has been revoked. Please request a new code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    stored["verified"] = True
    return MessageResponse(message="Email and mobile verified successfully.")


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

    # If an OTP is provided or exists in cache, check verification
    stored = _otp_cache.get(email)
    if payload.otp:
        if not stored or time.time() > stored["expires_at"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code.",
            )
        if stored["otp"] != payload.otp.strip() and not stored.get("verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check and try again.",
            )

    user = User(
        name=payload.name,
        email=email,
        phone=payload.phone or (stored.get("phone") if stored else None),
        password_hash=hash_password(payload.password),
        account_type=payload.account_type.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if email in _otp_cache:
        del _otp_cache[email]

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


class ConfirmDeletionRequest(BaseModel):
    token: str


@router.post("/request-account-deletion", response_model=MessageResponse)
@limiter.limit("5/minute")
def request_account_deletion(
    request: Request, payload: ForgotPasswordRequest, db: DbSession
) -> MessageResponse:
    """Public account deletion request for Google Play Store compliance."""
    email = payload.email.lower()
    user = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()

    if user is not None and user.is_active:
        token = create_account_deletion_token(str(user.id))
        confirm_link = f"{settings.FRONTEND_URL}/delete-account?token={token}"
        send_account_deletion_email(user.email, confirm_link)
        logger.info("Account deletion confirmation link generated for email=%s", email)

    return MessageResponse(
        message="If an account exists for that email, a deletion confirmation link has been sent."
    )


@router.post("/confirm-account-deletion", response_model=MessageResponse)
@limiter.limit("5/minute")
def confirm_account_deletion(
    request: Request, payload: ConfirmDeletionRequest, db: DbSession
) -> MessageResponse:
    """Public confirmation endpoint completing account and data deletion."""
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This account deletion link is invalid or has expired.",
    )
    try:
        claims = decode_token(payload.token)
    except jwt.PyJWTError as exc:
        raise invalid from exc

    if claims.get("type") != "deletion":
        raise invalid

    try:
        user_id = UUID(str(claims.get("sub")))
    except (ValueError, TypeError) as exc:
        raise invalid from exc

    user = db.get(User, user_id)
    if user is None:
        raise invalid

    # Clean up invoice files from storage
    products = db.execute(select(Product).where(Product.user_id == user.id)).scalars().all()
    storage = get_storage()
    for product in products:
        if product.invoice is not None:
            try:
                storage.delete(product.invoice.storage_path)
            except Exception:
                pass

    db.delete(user)
    db.commit()
    logger.info("Account %s successfully deleted via public confirmation link", user_id)
    return MessageResponse(message="Your account and all associated data have been permanently deleted.")
