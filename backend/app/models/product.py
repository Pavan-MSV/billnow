"""Product model — the core entity of BillNow."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.notification import Notification
    from app.models.service_record import ServiceRecord
    from app.models.user import User


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Basic information
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    brand: Mapped[str | None] = mapped_column(String(120))
    model_number: Mapped[str | None] = mapped_column(String(120))
    serial_number: Mapped[str | None] = mapped_column(String(120))

    # Purchase information
    purchase_date: Mapped[date | None] = mapped_column(Date, index=True)
    purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    seller: Mapped[str | None] = mapped_column(String(160))
    invoice_number: Mapped[str | None] = mapped_column(String(120))

    # Warranty information
    warranty_start_date: Mapped[date | None] = mapped_column(Date)
    warranty_period_months: Mapped[int | None] = mapped_column(Integer)
    warranty_end_date: Mapped[date | None] = mapped_column(Date, index=True)

    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="products")
    invoice: Mapped[Invoice | None] = relationship(
        back_populates="product", uselist=False, cascade="all, delete-orphan"
    )
    service_records: Mapped[list[ServiceRecord]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="desc(ServiceRecord.service_date)",
    )
    notifications: Mapped[list[Notification]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
