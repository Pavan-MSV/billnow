"""Profile, preferences, security and data-management routes."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.core.security import hash_password, verify_password
from app.models.notification import Notification
from app.models.product import Product
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest
from app.schemas.common import MessageResponse
from app.schemas.user import PreferencesUpdate, UserOut, UserUpdate
from app.services.storage import get_storage

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)


@router.put("/profile", response_model=UserOut)
def update_profile(payload: UserUpdate, current_user: CurrentUser, db: DbSession) -> UserOut:
    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"]:
        new_email = data["email"].lower()
        if new_email != current_user.email:
            clash = db.execute(
                select(User).where(func.lower(User.email) == new_email)
            ).scalar_one_or_none()
            if clash is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="That email address is already in use.",
                )
        data["email"] = new_email

    for field, value in data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.put("/preferences", response_model=UserOut)
def update_preferences(
    payload: PreferencesUpdate, current_user: CurrentUser, db: DbSession
) -> UserOut:
    data = payload.model_dump(exclude_unset=True)
    if "theme" in data and data["theme"] is not None:
        data["theme"] = data["theme"].value
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest, current_user: CurrentUser, db: DbSession
) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Your current password is incorrect."
        )
    current_user.password_hash = hash_password(payload.new_password)
    current_user.token_version += 1
    db.commit()
    return MessageResponse(message="Password updated successfully.")


@router.get("/export")
def export_data(current_user: CurrentUser, db: DbSession) -> JSONResponse:
    products = (
        db.execute(select(Product).where(Product.user_id == current_user.id)).scalars().all()
    )
    notifications = (
        db.execute(select(Notification).where(Notification.user_id == current_user.id))
        .scalars()
        .all()
    )

    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": UserOut.model_validate(current_user).model_dump(mode="json"),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "category": p.category,
                "brand": p.brand,
                "model_number": p.model_number,
                "serial_number": p.serial_number,
                "purchase_date": p.purchase_date.isoformat() if p.purchase_date else None,
                "purchase_price": float(p.purchase_price) if p.purchase_price is not None else None,
                "currency": p.currency,
                "seller": p.seller,
                "invoice_number": p.invoice_number,
                "warranty_start_date": p.warranty_start_date.isoformat() if p.warranty_start_date else None,
                "warranty_period_months": p.warranty_period_months,
                "warranty_end_date": p.warranty_end_date.isoformat() if p.warranty_end_date else None,
                "notes": p.notes,
                "services": [
                    {
                        "service_date": s.service_date.isoformat(),
                        "service_type": s.service_type,
                        "provider": s.provider,
                        "cost": float(s.cost) if s.cost is not None else None,
                        "description": s.description,
                        "next_service_date": s.next_service_date.isoformat()
                        if s.next_service_date
                        else None,
                        "notes": s.notes,
                    }
                    for s in p.service_records
                ],
            }
            for p in products
        ],
        "notifications": [
            {
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "due_date": n.due_date.isoformat() if n.due_date else None,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
    }

    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": 'attachment; filename="billnow-export.json"'},
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(current_user: CurrentUser, db: DbSession) -> None:
    # Best-effort removal of stored invoice files before the cascade delete.
    products = (
        db.execute(select(Product).where(Product.user_id == current_user.id)).scalars().all()
    )
    storage = get_storage()
    for product in products:
        if product.invoice is not None:
            try:
                storage.delete(product.invoice.storage_path)
            except Exception:  # pragma: no cover
                pass

    db.delete(current_user)
    db.commit()
