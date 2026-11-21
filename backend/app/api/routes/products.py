"""Product CRUD routes (all scoped to the authenticated user)."""

import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.constants import PREDEFINED_CATEGORIES
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
    product_to_out,
)

router = APIRouter(prefix="/products", tags=["products"])


def get_owned_product(db: Session, user_id: uuid.UUID, product_id: uuid.UUID) -> Product:
    """Fetch a product, enforcing ownership. Returns 404 (not 403) when the
    product does not belong to the caller so existence is never leaked."""
    product = db.get(Product, product_id)
    if product is None or product.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _apply_create_data(product: Product, payload: ProductCreate) -> None:
    product.name = payload.name
    product.category = payload.category
    product.brand = payload.brand
    product.model_number = payload.model_number
    product.serial_number = payload.serial_number
    product.purchase_date = payload.purchase_date
    product.purchase_price = Decimal(str(payload.purchase_price)) if payload.purchase_price is not None else None
    product.currency = payload.currency
    product.seller = payload.seller
    product.invoice_number = payload.invoice_number
    product.warranty_start_date = payload.warranty_start_date
    product.warranty_period_months = payload.warranty_period_months
    product.warranty_end_date = payload.warranty_end_date
    product.notes = payload.notes


@router.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    return PREDEFINED_CATEGORIES


@router.get("", response_model=ProductListResponse)
def list_products(
    current_user: CurrentUser,
    db: DbSession,
    search: str | None = Query(default=None, max_length=120),
    category: str | None = Query(default=None, max_length=80),
    warranty_status: str | None = Query(default=None),
    sort: str = Query(default="purchase_date"),
    order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
) -> ProductListResponse:
    stmt = select(Product).where(Product.user_id == current_user.id)

    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Product.name).like(term),
                func.lower(func.coalesce(Product.brand, "")).like(term),
                func.lower(func.coalesce(Product.model_number, "")).like(term),
                func.lower(func.coalesce(Product.serial_number, "")).like(term),
                func.lower(func.coalesce(Product.seller, "")).like(term),
                func.lower(func.coalesce(Product.invoice_number, "")).like(term),
                func.lower(Product.category).like(term),
            )
        )

    if category:
        stmt = stmt.where(Product.category == category)

    products = db.execute(stmt).scalars().all()

    items = [product_to_out(p, settings.WARRANTY_EXPIRING_SOON_DAYS) for p in products]

    if warranty_status:
        wanted = warranty_status.strip().lower()
        items = [item for item in items if item.warranty_status.value == wanted]

    def sort_key(item: ProductOut):
        if sort == "purchase_date":
            return item.purchase_date or date.min
        if sort == "warranty_end":
            return item.warranty_end_date or date.max
        if sort == "price":
            return item.purchase_price or 0.0
        if sort == "name":
            return item.name.lower()
        return item.created_at

    reverse = order.lower() != "asc"
    items.sort(key=sort_key, reverse=reverse)

    total = len(items)
    start = (page - 1) * page_size
    paged = items[start : start + page_size]

    return ProductListResponse(items=paged, total=total, page=page, page_size=page_size)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, current_user: CurrentUser, db: DbSession) -> ProductOut:
    product = Product(user_id=current_user.id)
    _apply_create_data(product, payload)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_out(product, settings.WARRANTY_EXPIRING_SOON_DAYS)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> ProductOut:
    product = get_owned_product(db, current_user.id, product_id)
    return product_to_out(product, settings.WARRANTY_EXPIRING_SOON_DAYS)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: uuid.UUID, payload: ProductUpdate, current_user: CurrentUser, db: DbSession
) -> ProductOut:
    product = get_owned_product(db, current_user.id, product_id)

    data = payload.model_dump(exclude_unset=True)

    if "purchase_price" in data and data["purchase_price"] is not None:
        data["purchase_price"] = Decimal(str(data["purchase_price"]))

    for field, value in data.items():
        setattr(product, field, value)

    # Recompute the warranty end date when the user changed the inputs but did
    # not supply an explicit end date of their own.
    if "warranty_end_date" not in data:
        start = product.warranty_start_date or product.purchase_date
        if start is not None and product.warranty_period_months:
            from app.schemas.product import _add_months

            product.warranty_end_date = _add_months(start, product.warranty_period_months)

    db.commit()
    db.refresh(product)
    return product_to_out(product, settings.WARRANTY_EXPIRING_SOON_DAYS)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    product = get_owned_product(db, current_user.id, product_id)

    # Remove the stored invoice file (best-effort) before deleting the row.
    if product.invoice is not None:
        try:
            from app.services.storage import get_storage

            get_storage().delete(product.invoice.storage_path)
        except Exception:  # pragma: no cover - storage failures must not block deletion
            pass

    db.delete(product)
    db.commit()
