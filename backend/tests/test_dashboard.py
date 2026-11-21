"""Dashboard, warranty listing and insights tests."""

from datetime import date, timedelta

from tests.conftest import auth_headers, create_product


def _seed_portfolio(client, token):
    create_product(
        client,
        token,
        name="Active TV",
        category="Television",
        purchase_price=45000,
        warranty_end_date=(date.today() + timedelta(days=500)).isoformat(),
    )
    create_product(
        client,
        token,
        name="Expiring Laptop",
        category="Laptop",
        purchase_price=100000,
        warranty_end_date=(date.today() + timedelta(days=10)).isoformat(),
    )
    create_product(
        client,
        token,
        name="Expired Fridge",
        category="Refrigerator",
        purchase_price=30000,
        warranty_end_date=(date.today() - timedelta(days=20)).isoformat(),
    )


def test_dashboard_summary(client, user_token):
    _seed_portfolio(client, user_token)
    summary = client.get("/api/dashboard/summary", headers=auth_headers(user_token)).json()

    assert summary["total_products"] == 3
    assert summary["active_warranties"] == 1
    assert summary["expiring_soon"] == 1
    assert summary["expired"] == 1
    assert summary["total_purchase_value"] == 175000.0
    assert summary["currency"] == "INR"


def test_dashboard_summary_empty(client, user_token):
    summary = client.get("/api/dashboard/summary", headers=auth_headers(user_token)).json()
    assert summary["total_products"] == 0
    assert summary["total_purchase_value"] == 0.0


def test_upcoming_expirations_sorted_and_windowed(client, user_token):
    _seed_portfolio(client, user_token)
    upcoming = client.get("/api/dashboard/upcoming?days=90", headers=auth_headers(user_token)).json()

    assert [item["name"] for item in upcoming] == ["Expiring Laptop"]
    assert upcoming[0]["days_remaining"] == 10


def test_warranty_list_and_counts(client, user_token):
    _seed_portfolio(client, user_token)
    data = client.get("/api/warranties", headers=auth_headers(user_token)).json()

    assert data["counts"] == {"active": 1, "expiring_soon": 1, "expired": 1}
    assert len(data["items"]) == 3

    expiring = client.get("/api/warranties/expiring", headers=auth_headers(user_token)).json()
    assert [item["name"] for item in expiring] == ["Expiring Laptop"]

    expired = client.get("/api/warranties/expired", headers=auth_headers(user_token)).json()
    assert [item["name"] for item in expired] == ["Expired Fridge"]

    filtered = client.get("/api/warranties?status=active", headers=auth_headers(user_token)).json()
    assert [item["name"] for item in filtered["items"]] == ["Active TV"]


def test_insights(client, user_token):
    _seed_portfolio(client, user_token)
    data = client.get("/api/insights", headers=auth_headers(user_token)).json()

    assert data["total_purchase_value"] == 175000.0
    assert data["currency"] == "INR"
    assert {row["category"] for row in data["products_by_category"]} == {
        "Television",
        "Laptop",
        "Refrigerator",
    }
    assert data["warranty_split"] == {"active": 1, "expiring_soon": 1, "expired": 1}
    assert len(data["spending_by_category"]) == 3


def test_dashboard_is_private(client, user_token, second_user_token):
    _seed_portfolio(client, user_token)
    summary = client.get("/api/dashboard/summary", headers=auth_headers(second_user_token)).json()
    assert summary["total_products"] == 0


def test_dashboard_requires_authentication(client):
    assert client.get("/api/dashboard/summary").status_code == 401
    assert client.get("/api/insights").status_code == 401
    assert client.get("/api/warranties").status_code == 401
