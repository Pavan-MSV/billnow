"""Firebase Cloud Messaging (FCM) push notification service.

Supports both single-device and multicast push notification dispatching.
Gracefully operates as a no-op when FCM_ENABLED is False or credentials are not supplied.
"""

from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if not settings.FCM_ENABLED or not settings.FIREBASE_CREDENTIALS_PATH:
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            _firebase_app = firebase_admin.get_app()
        return _firebase_app
    except Exception as exc:
        logger.warning("Failed to initialize Firebase Admin SDK: %s", exc)
        return None


def send_push_notification(
    tokens: list[str],
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> int:
    """Send push notification to multiple device tokens. Returns number of successful deliveries."""
    if not tokens:
        return 0

    app = _get_firebase_app()
    if not app:
        logger.info("[fcm disabled] tokens=%d title=%s body=%s", len(tokens), title, body)
        return 0

    try:
        from firebase_admin import messaging

        string_data = {k: str(v) for k, v in (data or {}).items()}

        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=string_data,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    icon="ic_notification",
                    color="#4f46e5",
                    sound="default",
                ),
            ),
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(
            "FCM multicast sent: %d success, %d failure",
            response.success_count,
            response.failure_count,
        )
        return response.success_count
    except Exception as exc:
        logger.exception("Failed to dispatch FCM push notification: %s", exc)
        return 0
