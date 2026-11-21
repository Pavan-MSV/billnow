"""Service history record for a product."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import Product


class ServiceRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "service_records"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    service_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    service_type: Mapped[str | None] = mapped_column(String(120))
    provider: Mapped[str | None] = mapped_column(String(160))
    cost: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    description: Mapped[str | None] = mapped_column(Text)
    next_service_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    product: Mapped[Product] = relationship(back_populates="service_records")
