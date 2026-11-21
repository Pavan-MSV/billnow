"""Product schemas, including dynamic warranty computation."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import WarrantyStatus
from app.schemas.invoice import InvoiceOut
from app.schemas.service import ServiceRecordOut
from app.services.warranty import compute_warranty


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=80)
    brand: str | None = Field(default=None, max_length=120)
    model_number: str | None = Field(default=None, max_length=120)
    serial_number: str | None = Field(default=None, max_length=120)

    purchase_date: date | None = None
    purchase_price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    seller: str | None = Field(default=None, max_length=160)
    invoice_number: str | None = Field(default=None, max_length=120)

    warranty_start_date: date | None = None
    warranty_period_months: int | None = Field(default=None, ge=0, le=1200)
    warranty_end_date: date | None = None

    notes: str | None = None

    @field_validator("name", "category")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value

    @field_validator("currency")
    @classmethod
    def _upper_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def _normalise_warranty(self) -> "ProductBase":
        """Auto-calculate the warranty end date when possible.

        Rules:
        * The warranty always starts on the purchase date unless the user
          explicitly supplied a different warranty start date.
        * If the end date is missing but we know a start date (or purchase
          date) and a duration, we compute it.
        * We never silently move an end date the user typed in themselves.
        """
        if self.warranty_start_date is None and self.purchase_date is not None:
            self.warranty_start_date = self.purchase_date

        if self.warranty_end_date is None and self.warranty_start_date and self.warranty_period_months:
            self.warranty_end_date = _add_months(self.warranty_start_date, self.warranty_period_months)

        return self


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    brand: str | None = Field(default=None, max_length=120)
    model_number: str | None = Field(default=None, max_length=120)
    serial_number: str | None = Field(default=None, max_length=120)

    purchase_date: date | None = None
    purchase_price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    seller: str | None = Field(default=None, max_length=160)
    invoice_number: str | None = Field(default=None, max_length=120)

    warranty_start_date: date | None = None
    warranty_period_months: int | None = Field(default=None, ge=0, le=1200)
    warranty_end_date: date | None = None

    notes: str | None = None

    @field_validator("currency")
    @classmethod
    def _upper_currency(cls, value: str | None) -> str | None:
        return value.upper() if value else value


class ProductOut(ProductBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    warranty_status: WarrantyStatus = WarrantyStatus.unknown
    warranty_days_remaining: int | None = None

    invoice: InvoiceOut | None = None
    services: list[ServiceRecordOut] = Field(default_factory=list)


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


def _add_months(start: date, months: int) -> date:
    """Add a number of months to a date, clamping the day to month end."""
    import calendar

    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(start.day, last_day))


def product_to_out(
    product,
    expiring_soon_days: int,
    today: date | None = None,
) -> ProductOut:
    """Build a ProductOut (with dynamically computed warranty status)."""
    status, days_remaining = compute_warranty(
        product.warranty_end_date, expiring_soon_days=expiring_soon_days, today=today
    )
    return ProductOut(
        id=product.id,
        user_id=product.user_id,
        name=product.name,
        category=product.category,
        brand=product.brand,
        model_number=product.model_number,
        serial_number=product.serial_number,
        purchase_date=product.purchase_date,
        purchase_price=float(product.purchase_price) if product.purchase_price is not None else None,
        currency=product.currency,
        seller=product.seller,
        invoice_number=product.invoice_number,
        warranty_start_date=product.warranty_start_date,
        warranty_period_months=product.warranty_period_months,
        warranty_end_date=product.warranty_end_date,
        notes=product.notes,
        created_at=product.created_at,
        updated_at=product.updated_at,
        warranty_status=status,
        warranty_days_remaining=days_remaining,
        invoice=InvoiceOut.model_validate(product.invoice) if product.invoice else None,
        services=[ServiceRecordOut.model_validate(s) for s in product.service_records],
    )
