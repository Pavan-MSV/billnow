"""Transactional email helper.

The initial web release ships with the notification *infrastructure* (email,
browser and later FCM push). Email delivery is opt-in via ``EMAIL_ENABLED`` so
the app runs fine with no SMTP server configured.
"""

import smtplib
import time
from datetime import date
from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Daily email counter to stay strictly within Brevo's 300 free emails/day limit
_daily_counter = {"date": date.today(), "count": 0}
BREVO_FREE_DAILY_LIMIT = 300


def _check_daily_limit() -> bool:
    today = date.today()
    if _daily_counter["date"] != today:
        _daily_counter["date"] = today
        _daily_counter["count"] = 0

    if _daily_counter["count"] >= BREVO_FREE_DAILY_LIMIT:
        logger.warning(
            "Brevo daily email limit reached (%d/%d). Suppressing email to protect free tier.",
            _daily_counter["count"],
            BREVO_FREE_DAILY_LIMIT,
        )
        return False
    return True


def send_email(to: str, subject: str, body: str, html: str | None = None) -> bool:
    """Send an email via SMTP (Brevo Free Tier). Returns True when delivered."""
    if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
        logger.info("[email disabled] to=%s subject=%s", to, subject)
        return False

    if not _check_daily_limit():
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
        _daily_counter["count"] += 1
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
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset your BillNow password. Click the button below to choose a new password:</p>
        <div style="margin: 24px 0; text-align: center;">
            <a href="{reset_link}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.4;">This link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
    """
    return send_email(to, subject, body, html=html)


def send_account_deletion_email(to: str, confirm_link: str) -> bool:
    subject = "Confirm BillNow Account Deletion Request"
    body = (
        "We received a request to permanently delete your BillNow account and all associated data.\n\n"
        f"Open this link to confirm deletion:\n{confirm_link}\n\n"
        "Warning: This action cannot be reversed. If you did not request this, please change your password immediately."
    )
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #fffaf0;">
        <h2 style="color: #dc2626; margin-bottom: 8px;">Delete Account Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to permanently delete your BillNow account and all tracked products, warranty records, invoices, and service histories.</p>
        <div style="margin: 24px 0; text-align: center;">
            <a href="{confirm_link}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Confirm Permanent Deletion</a>
        </div>
        <p style="color: #991b1b; font-size: 12px; line-height: 1.4;"><strong>Warning:</strong> This action is permanent and cannot be undone. If you did not request this, please change your password immediately.</p>
    </div>
    """
    return send_email(to, subject, body, html=html)


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
