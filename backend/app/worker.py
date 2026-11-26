"""Standalone background worker for daily warranty evaluations and push notifications.

Run periodically via cron or systemd timer:
    python -m app.worker
"""

import sys
from datetime import date

from sqlalchemy import select

from sqlalchemy.orm import Session

from app.core.logging import configure_logging, get_logger
from app.db.session import SessionLocal
from app.models.device_token import DeviceToken
from app.models.user import User
from app.services.fcm import send_push_notification
from app.services.notifications import generate_warranty_notifications, get_or_create_preferences

configure_logging()
logger = get_logger("billnow.worker")


def run_daily_warranty_sweep(db: Session | None = None) -> dict[str, int]:
    """Evaluate warranties for all active users, generate reminders, and dispatch FCM push alerts."""
    today = date.today()
    logger.info("Starting daily warranty evaluation sweep for date=%s", today)

    stats = {
        "users_scanned": 0,
        "notifications_generated": 0,
        "push_dispatched": 0,
    }

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        users = db.execute(select(User).where(User.is_active.is_(True))).scalars().all()
        stats["users_scanned"] = len(users)

        for user in users:
            new_notifications = generate_warranty_notifications(db, user, today=today)
            if not new_notifications:
                continue

            stats["notifications_generated"] += len(new_notifications)
            prefs = get_or_create_preferences(db, user)

            if prefs.push_enabled:
                tokens = (
                    db.execute(
                        select(DeviceToken.token).where(DeviceToken.user_id == user.id)
                    )
                    .scalars()
                    .all()
                )

                if tokens:
                    for notif in new_notifications:
                        sent_count = send_push_notification(
                            tokens=list(tokens),
                            title=notif.title,
                            body=notif.message,
                            data={
                                "product_id": str(notif.product_id or ""),
                                "notification_id": str(notif.id),
                                "type": notif.type,
                            },
                        )
                        stats["push_dispatched"] += sent_count

        logger.info(
            "Completed daily warranty sweep: scanned=%d users, generated=%d notifications, sent=%d push alerts",
            stats["users_scanned"],
            stats["notifications_generated"],
            stats["push_dispatched"],
        )
        return stats
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    results = run_daily_warranty_sweep()
    sys.exit(0)
