"""Notification routes + reminder preferences."""

import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, DbSession
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationOut,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
    ReadAllResponse,
    UnreadCountResponse,
)
from app.services.notifications import generate_warranty_notifications, get_or_create_preferences

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _to_out(notification: Notification) -> NotificationOut:
    return NotificationOut(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        product_id=notification.product_id,
        product_name=notification.product.name if notification.product else None,
        due_date=notification.due_date,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


@router.get("/preferences", response_model=NotificationPreferenceOut)
def get_preferences(current_user: CurrentUser, db: DbSession) -> NotificationPreferenceOut:
    prefs = get_or_create_preferences(db, current_user)
    return NotificationPreferenceOut.model_validate(prefs)


@router.put("/preferences", response_model=NotificationPreferenceOut)
def update_preferences(
    payload: NotificationPreferenceUpdate, current_user: CurrentUser, db: DbSession
) -> NotificationPreferenceOut:
    prefs = get_or_create_preferences(db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return NotificationPreferenceOut.model_validate(prefs)


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(current_user: CurrentUser, db: DbSession) -> UnreadCountResponse:
    # Generate any due reminders first so the badge is always accurate.
    generate_warranty_notifications(db, current_user, today=date.today())

    total = db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id, Notification.is_read.is_(False)
        )
    ).scalar_one()
    return UnreadCountResponse(count=int(total))


@router.patch("/read-all", response_model=ReadAllResponse)
def read_all(current_user: CurrentUser, db: DbSession) -> ReadAllResponse:
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return ReadAllResponse(updated=result.rowcount or 0)


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    current_user: CurrentUser,
    db: DbSession,
    unread_only: bool = Query(default=False),
) -> list[NotificationOut]:
    # Generate any due reminders on the fly so the list is always current.
    generate_warranty_notifications(db, current_user, today=date.today())

    stmt = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc())

    notifications = db.execute(stmt).scalars().all()
    return [_to_out(n) for n in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> NotificationOut:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return _to_out(notification)
