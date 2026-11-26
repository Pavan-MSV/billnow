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


def send_otp_email(to: str, otp: str) -> bool:
    subject = f"Your BillNow Verification Code: {otp}"
    body = (
        f"Hello,\n\n"
        f"Your verification code for BillNow is: {otp}\n\n"
        f"This code will expire in 10 minutes. Please enter it to complete your registration.\n\n"
        f"If you did not request this, please disregard this email."
    )
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">BillNow Verification</h2>
        <p style="color: #475569; font-size: 14px;">Use the verification code below to verify your account:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
            {otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
    </div>
    """
    return send_email(to, subject, body, html=html)
