"""Dashboard / warranty / insights aggregation.

All monetary values are returned as floats; the currency is taken from the
user's preference so multi-currency support can be layered on later.
"""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import WarrantyStatus
from app.models.product import Product
from app.schemas.dashboard import (
    CategoryAmount,
    CategoryCount,
    DashboardSummary,
    UpcomingExpiration,
    WarrantyItem,
    WarrantyListResponse,
    WarrantySplit,
)
from app.services.warranty import compute_warranty


def _products(db: Session, user_id: uuid.UUID) -> list[Product]:
    return (
        db.execute(select(Product).where(Product.user_id == user_id))
        .scalars()
        .all()
    )


def _split(products: list[Product], today: date) -> WarrantySplit:
    active = expiring_soon = expired = 0
    for product in products:
        status, _ = compute_warranty(
            product.warranty_end_date, settings.WARRANTY_EXPIRING_SOON_DAYS, today
        )
        if status == WarrantyStatus.active:
            active += 1
        elif status == WarrantyStatus.expiring_soon:
            expiring_soon += 1
        elif status == WarrantyStatus.expired:
            expired += 1
    return WarrantySplit(active=active, expiring_soon=expiring_soon, expired=expired)


def dashboard_summary(db: Session, user_id: uuid.UUID, currency: str) -> DashboardSummary:
    today = date.today()
    products = _products(db, user_id)
    split = _split(products, today)

    total_value = Decimal("0")
    for product in products:
        if product.purchase_price is not None:
            total_value += product.purchase_price

    return DashboardSummary(
        total_products=len(products),
        active_warranties=split.active,
        expiring_soon=split.expiring_soon,
        expired=split.expired,
        total_purchase_value=float(total_value),
        currency=currency,
    )


def upcoming_expirations(
    db: Session, user_id: uuid.UUID, days: int = 90
) -> list[UpcomingExpiration]:
    today = date.today()
    result: list[UpcomingExpiration] = []
    for product in _products(db, user_id):
        status, remaining = compute_warranty(
            product.warranty_end_date, settings.WARRANTY_EXPIRING_SOON_DAYS, today
        )
        if remaining is None or remaining < 0 or remaining > days:
            continue
        result.append(
            UpcomingExpiration(
                product_id=product.id,
                name=product.name,
                category=product.category,
                warranty_end_date=product.warranty_end_date,
                days_remaining=remaining,
                warranty_status=status,
            )
        )
    result.sort(key=lambda item: item.days_remaining if item.days_remaining is not None else 0)
    return result


def warranty_list(
    db: Session, user_id: uuid.UUID, status: WarrantyStatus | None = None
) -> WarrantyListResponse:
    today = date.today()
    products = _products(db, user_id)
    split = _split(products, today)

    items: list[WarrantyItem] = []
    for product in products:
        product_status, remaining = compute_warranty(
            product.warranty_end_date, settings.WARRANTY_EXPIRING_SOON_DAYS, today
        )
        if product_status == WarrantyStatus.unknown:
            continue
        if status is not None and product_status != status:
            continue
        items.append(
            WarrantyItem(
                product_id=product.id,
                name=product.name,
                category=product.category,
                brand=product.brand,
                warranty_end_date=product.warranty_end_date,
                warranty_status=product_status,
                warranty_days_remaining=remaining,
                purchase_price=float(product.purchase_price)
                if product.purchase_price is not None
                else None,
                currency=product.currency,
            )
        )

    items.sort(
        key=lambda item: item.warranty_end_date or date.max,
    )
    return WarrantyListResponse(items=items, counts=split)


def insights(db: Session, user_id: uuid.UUID, currency: str) -> dict:
    today = date.today()
    products = _products(db, user_id)

    counts: dict[str, int] = {}
    spend: dict[str, Decimal] = {}
    total_value = Decimal("0")

    for product in products:
        counts[product.category] = counts.get(product.category, 0) + 1
        if product.purchase_price is not None:
            spend[product.category] = spend.get(product.category, Decimal("0")) + product.purchase_price
            total_value += product.purchase_price

    return {
        "total_purchase_value": float(total_value),
        "currency": currency,
        "products_by_category": [
            CategoryCount(category=category, count=count)
            for category, count in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "spending_by_category": [
            CategoryAmount(category=category, amount=float(amount))
            for category, amount in sorted(spend.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "warranty_split": _split(products, today),
        "upcoming_expirations": upcoming_expirations(db, user_id, days=90),
    }
