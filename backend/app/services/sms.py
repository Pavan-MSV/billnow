"""Transactional SMS helper for phone OTP verification and alerts.

Supports:
- Fast2SMS (Indian SMS gateway with free credits, optimal for +91 mobile numbers)
- Twilio (global SMS provider with free trial)
- Graceful disabled / mock fallback when SMS_ENABLED is False
"""

import re
import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def clean_phone_number(phone: str) -> str:
    """Normalize phone number to digits only."""
    return re.sub(r"\D", "", phone)


def send_fast2sms(phone: str, otp: str) -> bool:
    """Send OTP via Fast2SMS (https://www.fast2sms.com).

    Fast2SMS provides free wallet credits upon sign-up and supports OTP route.
    """
    if not settings.FAST2SMS_API_KEY:
        logger.error("Fast2SMS API key (FAST2SMS_API_KEY) is not configured in settings.")
        return False

    digits = clean_phone_number(phone)
    if len(digits) > 10:
        digits = digits[-10:]

    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": digits,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers=headers)
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            if response.status_code == 200 and data.get("return") is True:
                logger.info("Fast2SMS OTP sent successfully to ending in ...%s", digits[-4:])
                return True
            else:
                logger.error("Fast2SMS delivery rejected: status=%s, response=%s", response.status_code, data)
                return False
    except Exception as exc:  # pragma: no cover
        logger.exception("Fast2SMS request failed: %s", exc)
        return False


def send_twilio_sms(phone: str, otp: str) -> bool:
    """Send OTP via Twilio REST API."""
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER):
        logger.error("Twilio credentials are not fully configured in settings.")
        return False

    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_number = settings.TWILIO_FROM_NUMBER

    # Ensure E.164 format (+91 for 10-digit Indian numbers if missing prefix)
    to_number = phone.strip()
    digits = clean_phone_number(to_number)
    if not to_number.startswith("+"):
        to_number = f"+91{digits}" if len(digits) == 10 else f"+{digits}"

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    body = f"Your BillNow verification code is: {otp}. Valid for 10 minutes. Do not share this code."

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                url,
                data={"From": from_number, "To": to_number, "Body": body},
                auth=(account_sid, auth_token),
            )
            if response.status_code in (200, 201):
                logger.info("Twilio SMS sent successfully to ending in ...%s", to_number[-4:])
                return True
            else:
                logger.error("Twilio delivery rejected: status=%s, body=%s", response.status_code, response.text)
                return False
    except Exception as exc:  # pragma: no cover
        logger.exception("Twilio request failed: %s", exc)
        return False


def send_otp_sms(phone: str, otp: str) -> bool:
    """Send verification OTP to mobile phone via SMS."""
    if not settings.SMS_ENABLED:
        logger.info("[SMS disabled] destination=%s code=%s", phone, otp)
        return False

    provider = (settings.SMS_PROVIDER or "fast2sms").lower()
    if provider == "fast2sms":
        return send_fast2sms(phone, otp)
    elif provider == "twilio":
        return send_twilio_sms(phone, otp)
    else:
        logger.error("Unknown SMS provider: %s", settings.SMS_PROVIDER)
        return False
