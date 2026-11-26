"""Profile, preferences, export and account-deletion tests."""

from tests.conftest import auth_headers, create_product


def test_get_and_update_profile(client, user_token):
    headers = auth_headers(user_token)
    profile = client.get("/api/settings/profile", headers=headers).json()
    assert profile["email"] == "user@example.com"

    updated = client.put(
        "/api/settings/profile", json={"name": "Renamed User"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Renamed User"


def test_email_change_must_be_unique(client, user_token, second_user_token):
    client.put(
        "/api/settings/profile", json={"email": "another@example.com"}, headers=auth_headers(second_user_token)
    )
    response = client.put(
        "/api/settings/profile", json={"email": "another@example.com"}, headers=auth_headers(user_token)
    )
    assert response.status_code == 409


def test_update_preferences_currency_and_theme(client, user_token):
    headers = auth_headers(user_token)
    response = client.put(
        "/api/settings/preferences", json={"currency": "usd", "theme": "dark"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["currency"] == "USD"
    assert response.json()["theme"] == "dark"


def test_export_returns_user_data(client, user_token):
    create_product(client, user_token, name="Exported TV")
    response = client.get("/api/settings/export", headers=auth_headers(user_token))

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "user@example.com"
    assert body["products"][0]["name"] == "Exported TV"
    assert "attachment" in response.headers["content-disposition"]


def test_export_csv_returns_formatted_file(client, user_token):
    create_product(client, user_token, name="Exported Phone", brand="Apple", purchase_price=79999)
    response = client.get("/api/settings/export?format=csv", headers=auth_headers(user_token))

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "billnow-products.csv" in response.headers["content-disposition"]
    text = response.text
    assert "Product ID,Product Name,Category,Brand" in text
    assert "Exported Phone" in text
    assert "Apple" in text
    assert "79999.00" in text


def test_delete_account_with_password(client):
    reg = client.post(
        "/api/auth/register",
        json={"name": "Del User", "email": "del@example.com", "password": "Password123"},
    )
    token = reg.json()["access_token"]
    headers = auth_headers(token)

    # Wrong password fails
    bad = client.request("DELETE", "/api/settings/account", json={"password": "WrongPassword"}, headers=headers)
    assert bad.status_code == 400
    assert "incorrect" in bad.json()["detail"].lower()

    # Correct password succeeds
    good = client.request("DELETE", "/api/settings/account", json={"password": "Password123"}, headers=headers)
    assert good.status_code == 204
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_public_account_deletion_request_and_confirmation(client):
    from app.core.security import create_account_deletion_token

    # Register user
    reg = client.post(
        "/api/auth/register",
        json={"name": "Pub Del", "email": "pubdel@example.com", "password": "Password123"},
    )
    user_id = reg.json()["user"]["id"]

    # Request deletion (unauthenticated public endpoint)
    req = client.post("/api/auth/request-account-deletion", json={"email": "pubdel@example.com"})
    assert req.status_code == 200
    assert "deletion confirmation link" in req.json()["message"]

    # Generate token and confirm deletion (unauthenticated public endpoint)
    token = create_account_deletion_token(user_id)
    confirm = client.post("/api/auth/confirm-account-deletion", json={"token": token})
    assert confirm.status_code == 200
    assert "permanently deleted" in confirm.json()["message"]

    # Account no longer exists to login
    login_attempt = client.post("/api/auth/login", json={"email": "pubdel@example.com", "password": "Password123"})
    assert login_attempt.status_code == 401


def test_delete_account_removes_everything(client, user_token, second_user_token):
    create_product(client, user_token)
    assert client.delete("/api/settings/account", headers=auth_headers(user_token)).status_code == 204

    # The token is now invalid because the user no longer exists.
    assert client.get("/api/auth/me", headers=auth_headers(user_token)).status_code == 401
    # Other users are unaffected.
    assert client.get("/api/settings/profile", headers=auth_headers(second_user_token)).status_code == 200


def test_settings_require_authentication(client):
    assert client.get("/api/settings/profile").status_code == 401
    assert client.get("/api/settings/export").status_code == 401
