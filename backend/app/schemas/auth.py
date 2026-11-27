"""Authentication schemas."""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import AccountType
from app.schemas.user import UserOut
from app.schemas.validators import validate_password_strength


class SendOtpRequest(BaseModel):
    email: EmailStr
    phone: str = Field(min_length=7, max_length=25)
    channel: Literal["email", "sms"] = "email"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)


class OtpResponse(BaseModel):
    message: str
    channel: str = "email"
    dev_otp: str | None = None
    expires_in: int = 600


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    otp: str | None = None
    firebase_id_token: str | None = None
    password: str
    account_type: AccountType = AccountType.personal

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class TokenResponse(BaseModel):
    user: UserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
