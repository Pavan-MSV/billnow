"""Shared FastAPI dependencies (DB session + current authenticated user)."""

from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False
)

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not token:
        raise _CREDENTIALS_ERROR

    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise _CREDENTIALS_ERROR from exc

    if payload.get("type") != "access":
        raise _CREDENTIALS_ERROR

    subject = payload.get("sub")
    if not subject:
        raise _CREDENTIALS_ERROR

    try:
        user_id = UUID(subject)
    except (ValueError, TypeError) as exc:
        raise _CREDENTIALS_ERROR from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_ERROR

    # Tokens issued before a "logout from all sessions" are rejected.
    if int(payload.get("ver", 0)) != user.token_version:
        raise _CREDENTIALS_ERROR

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]
