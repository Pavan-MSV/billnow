"""Shared, reusable Pydantic validators."""

import re

_PASSWORD_MIN_LENGTH = 8
_PASSWORD_MAX_BYTES = 72


def validate_password_strength(value: str) -> str:
    """Enforce a secure password policy: 8-72 chars, at least one letter and one digit."""
    if len(value) < _PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {_PASSWORD_MIN_LENGTH} characters long")
    if len(value.encode("utf-8")) > _PASSWORD_MAX_BYTES:
        raise ValueError(f"Password cannot exceed {_PASSWORD_MAX_BYTES} bytes")
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one number")
    return value
