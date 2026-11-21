"""Dashboard, warranty listing and insights schemas."""

import uuid
from datetime import date

from pydantic import BaseModel

from app.models.enums import WarrantyStatus


class DashboardSummary(BaseModel):
    total_products: int
    active_warranties: int
    expiring_soon: int
    expired: int
    total_purchase_value: float
    currency: str


class UpcomingExpiration(BaseModel):
    product_id: uuid.UUID
    name: str
    category: str
    warranty_end_date: date | None = None
    days_remaining: int | None = None
    warranty_status: WarrantyStatus


class WarrantyItem(BaseModel):
    product_id: uuid.UUID
    name: str
    category: str
    brand: str | None = None
    warranty_end_date: date | None = None
    warranty_status: WarrantyStatus
    warranty_days_remaining: int | None = None
    purchase_price: float | None = None
    currency: str


class WarrantySplit(BaseModel):
    active: int
    expiring_soon: int
    expired: int


class WarrantyListResponse(BaseModel):
    items: list[WarrantyItem]
    counts: WarrantySplit


class CategoryCount(BaseModel):
    category: str
    count: int


class CategoryAmount(BaseModel):
    category: str
    amount: float


class InsightsResponse(BaseModel):
    total_purchase_value: float
    currency: str
    products_by_category: list[CategoryCount]
    spending_by_category: list[CategoryAmount]
    warranty_split: WarrantySplit
    upcoming_expirations: list[UpcomingExpiration]
