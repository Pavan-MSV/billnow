"""Shared, reusable Pydantic validators."""

import re

_PASSWORD_MIN_LENGTH = 8


def validate_password_strength(value: str) -> str:
    """Enforce a minimum password policy: >=8 chars, at least one letter and one digit."""
    if len(value) < _PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {_PASSWORD_MIN_LENGTH} characters long")
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one number")
    return value
