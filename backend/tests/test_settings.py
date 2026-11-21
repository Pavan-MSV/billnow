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
