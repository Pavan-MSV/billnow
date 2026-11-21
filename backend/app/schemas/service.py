"""Service record schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceRecordBase(BaseModel):
    service_date: date
    service_type: str | None = Field(default=None, max_length=120)
    provider: str | None = Field(default=None, max_length=160)
    cost: float | None = Field(default=None, ge=0)
    description: str | None = None
    next_service_date: date | None = None
    notes: str | None = None


class ServiceRecordCreate(ServiceRecordBase):
    pass


class ServiceRecordUpdate(BaseModel):
    service_date: date | None = None
    service_type: str | None = Field(default=None, max_length=120)
    provider: str | None = Field(default=None, max_length=160)
    cost: float | None = Field(default=None, ge=0)
    description: str | None = None
    next_service_date: date | None = None
    notes: str | None = None


class ServiceRecordOut(ServiceRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime
