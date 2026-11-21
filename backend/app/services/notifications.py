"""Warranty reminder generation.

Reminders are generated idempotently: the ``notifications`` table has a unique
constraint on (user_id, product_id, type, due_date), so running the job
repeatedly can never produce duplicates.
"""

from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.product import Product
from app.models.user import User
from app.services.warranty import compute_warranty

logger = get_logger(__name__)


def get_or_create_preferences(db: Session, user: User) -> NotificationPreference:
    prefs = db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    ).scalar_one_or_none()
    if prefs is None:
        prefs = NotificationPreference(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


def _already_exists(
    db: Session, user_id, product_id, ntype: NotificationType, due: date | None
) -> bool:
    stmt = select(Notification.id).where(
        Notification.user_id == user_id,
        Notification.product_id == product_id,
        Notification.type == ntype.value,
        Notification.due_date == due,
    )
    return db.execute(stmt).first() is not None


def _maybe_create(
    db: Session,
    user_id,
    product: Product,
    ntype: NotificationType,
    due: date | None,
    title: str,
    message: str,
) -> Notification | None:
    if _already_exists(db, user_id, product.id, ntype, due):
        return None

    notification = Notification(
        user_id=user_id,
        product_id=product.id,
        type=ntype.value,
        title=title,
        message=message,
        due_date=due,
    )
    try:
        with db.begin_nested():
            db.add(notification)
    except IntegrityError:
        # Race with a concurrent job — the other transaction won.
        return None
    return notification


def generate_warranty_notifications(
    db: Session, user: User, today: date | None = None
) -> list[Notification]:
    """Create any due warranty reminders for a single user."""
    reference = today or date.today()
    prefs = get_or_create_preferences(db, user)
    enabled_days = prefs.enabled_reminder_days()

    products = (
        db.execute(
            select(Product).where(
                Product.user_id == user.id, Product.warranty_end_date.is_not(None)
            )
        )
        .scalars()
        .all()
    )

    created: list[Notification] = []
    for product in products:
        _, remaining = compute_warranty(
            product.warranty_end_date, settings.WARRANTY_EXPIRING_SOON_DAYS, reference
        )
        if remaining is None:
            continue

        end_label = product.warranty_end_date.strftime("%d %b %Y") if product.warranty_end_date else "—"

        if remaining < 0:
            notification = _maybe_create(
                db,
                user.id,
                product,
                NotificationType.warranty_expired,
                product.warranty_end_date,
                title="Warranty expired",
                message=f"{product.name} warranty expired on {end_label}.",
            )
        elif remaining in enabled_days:
            days_label = "1 day" if remaining == 1 else f"{remaining} days"
            notification = _maybe_create(
                db,
                user.id,
                product,
                NotificationType.warranty_expiring,
                product.warranty_end_date,
                title=f"Warranty expiring in {days_label}",
                message=(
                    f"{product.name} warranty expires on {end_label} "
                    f"({days_label} remaining)."
                ),
            )
        else:
            notification = None

        if notification is not None:
            created.append(notification)

    if created:
        db.commit()

    return created
