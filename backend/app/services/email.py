"""Transactional email helper.

The initial web release ships with the notification *infrastructure* (email,
browser and later FCM push). Email delivery is opt-in via ``EMAIL_ENABLED`` so
the app runs fine with no SMTP server configured.
"""

import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def send_email(to: str, subject: str, body: str, html: str | None = None) -> bool:
    """Send an email. Returns True when actually delivered."""
    if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
        logger.info("[email disabled] to=%s subject=%s", to, subject)
        return False

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    if html:
        message.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            smtp.send_message(message)
        return True
    except Exception:  # pragma: no cover - network dependent
        logger.exception("Failed to send email to %s", to)
        return False


def send_password_reset_email(to: str, reset_link: str) -> bool:
    subject = "Reset your BillNow password"
    body = (
        "We received a request to reset your BillNow password.\n\n"
        f"Open this link to choose a new password:\n{reset_link}\n\n"
        "If you did not request this, you can safely ignore this email."
    )
    return send_email(to, subject, body)
