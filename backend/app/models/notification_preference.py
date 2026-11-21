"""Per-user notification preferences (reminder schedule + channels)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class NotificationPreference(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    reminder_90_days: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminder_60_days: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_30_days: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminder_7_days: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminder_1_day: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    email_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    browser_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped[User] = relationship(back_populates="notification_preference")

    def enabled_reminder_days(self) -> set[int]:
        days: set[int] = set()
        if self.reminder_90_days:
            days.add(90)
        if self.reminder_60_days:
            days.add(60)
        if self.reminder_30_days:
            days.add(30)
        if self.reminder_7_days:
            days.add(7)
        if self.reminder_1_day:
            days.add(1)
        return days
