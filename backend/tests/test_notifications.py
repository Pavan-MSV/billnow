"""Notification generation, de-duplication and preference tests."""

from datetime import date, timedelta

from tests.conftest import auth_headers, create_product


def _product_expiring_in(client, token, days: int, name: str = "Expiring Product"):
    end = date.today() + timedelta(days=days)
    return create_product(
        client,
        token,
        name=name,
        warranty_end_date=end.isoformat(),
        warranty_start_date=(date.today() - timedelta(days=365)).isoformat(),
    )


def test_reminder_generated_for_30_day_window(client, user_token):
    _product_expiring_in(client, user_token, 30, "Samsung TV")

    notifications = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "warranty_expiring"
    assert notifications[0]["product_name"] == "Samsung TV"
    assert "30 days" in notifications[0]["title"]
    assert notifications[0]["is_read"] is False


def test_reminders_are_never_duplicated(client, user_token):
    _product_expiring_in(client, user_token, 90, "TV")

    first = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    second = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    third = client.get("/api/notifications", headers=auth_headers(user_token)).json()

    assert len(first) == len(second) == len(third) == 1


def test_disabled_reminder_window_does_not_notify(client, user_token):
    # 60-day reminders are OFF by default.
    _product_expiring_in(client, user_token, 60, "Fridge")
    assert client.get("/api/notifications", headers=auth_headers(user_token)).json() == []

    # Enable it and the reminder appears.
    prefs = client.get("/api/notifications/preferences", headers=auth_headers(user_token)).json()
    assert prefs["reminder_60_days"] is False

    client.put(
        "/api/notifications/preferences",
        json={"reminder_60_days": True},
        headers=auth_headers(user_token),
    )
    notifications = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    assert len(notifications) == 1
    assert "60 days" in notifications[0]["title"]


def test_expired_warranty_notification(client, user_token):
    _product_expiring_in(client, user_token, -5, "Old Fridge")

    notifications = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "warranty_expired"
    assert notifications[0]["title"] == "Warranty expired"


def test_unread_count_read_and_read_all(client, user_token):
    _product_expiring_in(client, user_token, 30, "TV")
    _product_expiring_in(client, user_token, 7, "Laptop")
    headers = auth_headers(user_token)

    assert client.get("/api/notifications/unread-count", headers=headers).json()["count"] == 2

    notifications = client.get("/api/notifications", headers=headers).json()
    first_id = notifications[0]["id"]

    marked = client.patch(f"/api/notifications/{first_id}/read", headers=headers)
    assert marked.status_code == 200
    assert marked.json()["is_read"] is True
    assert client.get("/api/notifications/unread-count", headers=headers).json()["count"] == 1

    assert client.patch("/api/notifications/read-all", headers=headers).json()["updated"] == 1
    assert client.get("/api/notifications/unread-count", headers=headers).json()["count"] == 0

    unread_only = client.get("/api/notifications?unread_only=true", headers=headers).json()
    assert unread_only == []


def test_notifications_are_private_to_owner(client, user_token, second_user_token):
    _product_expiring_in(client, user_token, 30, "TV")
    client.get("/api/notifications", headers=auth_headers(user_token))

    notifications = client.get("/api/notifications", headers=auth_headers(user_token)).json()
    other = auth_headers(second_user_token)

    assert client.get("/api/notifications", headers=other).json() == []
    assert client.patch(
        f"/api/notifications/{notifications[0]['id']}/read", headers=other
    ).status_code == 404


def test_default_preferences(client, user_token):
    prefs = client.get("/api/notifications/preferences", headers=auth_headers(user_token)).json()
    assert prefs == {
        "reminder_90_days": True,
        "reminder_60_days": False,
        "reminder_30_days": True,
        "reminder_7_days": True,
        "reminder_1_day": True,
        "email_enabled": False,
        "push_enabled": False,
        "browser_enabled": True,
    }


def test_update_preferences_persists(client, user_token):
    response = client.put(
        "/api/notifications/preferences",
        json={"email_enabled": True, "reminder_90_days": False},
        headers=auth_headers(user_token),
    )
    assert response.status_code == 200

    prefs = client.get("/api/notifications/preferences", headers=auth_headers(user_token)).json()
    assert prefs["email_enabled"] is True
    assert prefs["reminder_90_days"] is False
    assert prefs["browser_enabled"] is True  # untouched


def test_notifications_require_authentication(client):
    assert client.get("/api/notifications").status_code == 401


def test_fcm_token_registration_and_unregistration(client, user_token):
    headers = auth_headers(user_token)
    token_str = "fcm-fake-device-token-12345"

    # Register token
    reg = client.post(
        "/api/notifications/fcm-token",
        json={"token": token_str, "platform": "android"},
        headers=headers,
    )
    assert reg.status_code == 200
    assert "registered successfully" in reg.json()["message"]

    # Re-registering the same token idempotently updates it
    reg2 = client.post(
        "/api/notifications/fcm-token",
        json={"token": token_str, "platform": "android"},
        headers=headers,
    )
    assert reg2.status_code == 200

    # Unregister token
    unreg = client.delete(
        f"/api/notifications/fcm-token?token={token_str}",
        headers=headers,
    )
    assert unreg.status_code == 200
    assert "unregistered successfully" in unreg.json()["message"]


def test_daily_warranty_sweep_worker(client, user_token, db_session):
    from app.worker import run_daily_warranty_sweep

    # Create product expiring in 30 days
    _product_expiring_in(client, user_token, 30, "Swept Product")

    # Enable push notifications and register device token
    client.put(
        "/api/notifications/preferences",
        json={"push_enabled": True},
        headers=auth_headers(user_token),
    )
    client.post(
        "/api/notifications/fcm-token",
        json={"token": "test-sweep-device-token-abc", "platform": "android"},
        headers=auth_headers(user_token),
    )

    # Run the worker sweep using the active test session
    results = run_daily_warranty_sweep(db=db_session)
    assert results["users_scanned"] >= 1
    assert "notifications_generated" in results
    assert "push_dispatched" in results
