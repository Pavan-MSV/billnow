"""Notification + notification preference schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    title: str
    message: str
    product_id: uuid.UUID | None = None
    product_name: str | None = None
    due_date: date | None = None
    is_read: bool
    created_at: datetime


class NotificationPreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reminder_90_days: bool
    reminder_60_days: bool
    reminder_30_days: bool
    reminder_7_days: bool
    reminder_1_day: bool
    email_enabled: bool
    push_enabled: bool
    browser_enabled: bool


class NotificationPreferenceUpdate(BaseModel):
    reminder_90_days: bool | None = None
    reminder_60_days: bool | None = None
    reminder_30_days: bool | None = None
    reminder_7_days: bool | None = None
    reminder_1_day: bool | None = None
    email_enabled: bool | None = None
    push_enabled: bool | None = None
    browser_enabled: bool | None = None


class UnreadCountResponse(BaseModel):
    count: int


class ReadAllResponse(BaseModel):
    updated: int
