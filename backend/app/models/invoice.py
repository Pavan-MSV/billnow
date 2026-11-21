"""Invoice model — stores metadata only, never the binary itself."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Invoice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "invoices"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(120), nullable=False)
    # Size in bytes (BigInteger to be safe with large PDFs).
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    # Object key/path inside the configured storage backend.
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_backend: Mapped[str] = mapped_column(String(20), default="local", nullable=False)

    product: Mapped[Product] = relationship(back_populates="invoice")

    @property
    def uploaded_at(self):
        """Public alias for ``created_at`` used by the API response schema."""
        return self.created_at
