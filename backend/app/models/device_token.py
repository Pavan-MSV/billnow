"""Device token model for FCM (Firebase Cloud Messaging) push notifications."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class DeviceToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "device_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    token: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(20), default="android", nullable=False)

    user: Mapped[User] = relationship(back_populates="device_tokens")
