"""Warranty calculation helpers.

Status is always derived dynamically from the current date so it never goes
stale in the database.
"""

from datetime import date

from app.models.enums import WarrantyStatus


def compute_warranty(
    warranty_end: date | None,
    expiring_soon_days: int = 30,
    today: date | None = None,
) -> tuple[WarrantyStatus, int | None]:
    """Return (status, days_remaining) for a warranty end date.

    * ``None`` end date -> unknown.
    * end date before today -> expired.
    * end date within ``expiring_soon_days`` (inclusive) -> expiring_soon.
    * otherwise active.
    """
    if warranty_end is None:
        return WarrantyStatus.unknown, None

    reference = today or date.today()
    days_remaining = (warranty_end - reference).days

    if days_remaining < 0:
        return WarrantyStatus.expired, days_remaining
    if days_remaining <= expiring_soon_days:
        return WarrantyStatus.expiring_soon, days_remaining
    return WarrantyStatus.active, days_remaining


def days_remaining(warranty_end: date | None, today: date | None = None) -> int | None:
    if warranty_end is None:
        return None
    return (warranty_end - (today or date.today())).days
