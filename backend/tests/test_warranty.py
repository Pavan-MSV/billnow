"""Unit tests for the warranty calculation logic."""

from datetime import date, timedelta

from app.models.enums import WarrantyStatus
from app.services.warranty import compute_warranty


def test_unknown_when_no_end_date():
    status, remaining = compute_warranty(None)
    assert status == WarrantyStatus.unknown
    assert remaining is None


def test_active_when_far_in_future():
    today = date(2026, 1, 1)
    status, remaining = compute_warranty(date(2028, 1, 1), expiring_soon_days=30, today=today)
    assert status == WarrantyStatus.active
    assert remaining == 730


def test_expiring_soon_within_window():
    today = date(2026, 1, 1)
    status, remaining = compute_warranty(today + timedelta(days=30), expiring_soon_days=30, today=today)
    assert status == WarrantyStatus.expiring_soon
    assert remaining == 30


def test_expiring_today_is_expiring_soon_not_expired():
    today = date(2026, 1, 1)
    status, remaining = compute_warranty(today, expiring_soon_days=30, today=today)
    assert status == WarrantyStatus.expiring_soon
    assert remaining == 0


def test_expired_yesterday():
    today = date(2026, 1, 1)
    status, remaining = compute_warranty(today - timedelta(days=1), expiring_soon_days=30, today=today)
    assert status == WarrantyStatus.expired
    assert remaining == -1


def test_threshold_is_configurable():
    today = date(2026, 1, 1)
    end = today + timedelta(days=45)
    assert compute_warranty(end, expiring_soon_days=30, today=today)[0] == WarrantyStatus.active
    assert compute_warranty(end, expiring_soon_days=60, today=today)[0] == WarrantyStatus.expiring_soon
