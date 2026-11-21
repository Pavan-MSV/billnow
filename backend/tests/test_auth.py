"""Authentication flow tests."""

from tests.conftest import auth_headers


def test_register_returns_tokens_and_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Pavan", "email": "Pavan@Example.com", "password": "Password123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "pavan@example.com"  # normalised
    assert body["user"]["name"] == "Pavan"
    assert body["access_token"]
    assert body["refresh_token"]
    assert "password_hash" not in body["user"]


def test_register_rejects_duplicate_email(client):
    payload = {"name": "A", "email": "dup@example.com", "password": "Password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_register_rejects_weak_password(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "weak@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_success_and_failure(client):
    client.post(
        "/api/auth/register",
        json={"name": "A", "email": "login@example.com", "password": "Password123"},
    )
    ok = client.post("/api/auth/login", json={"email": "login@example.com", "password": "Password123"})
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = client.post("/api/auth/login", json={"email": "login@example.com", "password": "WrongPass1"})
    assert bad.status_code == 401


def test_me_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_current_user(client, user_token):
    response = client.get("/api/auth/me", headers=auth_headers(user_token))
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_me_rejects_garbage_token(client):
    assert client.get("/api/auth/me", headers=auth_headers("not-a-jwt")).status_code == 401


def test_refresh_issues_new_tokens(client):
    data = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "refresh@example.com", "password": "Password123"},
    ).json()

    response = client.post("/api/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert response.status_code == 200
    assert response.json()["access_token"]

    # An access token must not be usable as a refresh token.
    assert client.post("/api/auth/refresh", json={"refresh_token": data["access_token"]}).status_code == 401


def test_forgot_password_does_not_leak_account_existence(client):
    known = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert known.status_code == 200
    assert "If an account exists" in known.json()["message"]


def test_reset_password_flow_and_token_invalidation(client):
    from app.core.security import create_password_reset_token

    data = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "reset@example.com", "password": "Password123"},
    ).json()
    user_id = data["user"]["id"]

    token = create_password_reset_token(user_id)
    response = client.post(
        "/api/auth/reset-password", json={"token": token, "new_password": "BrandNew123"}
    )
    assert response.status_code == 200

    assert client.post(
        "/api/auth/login", json={"email": "reset@example.com", "password": "BrandNew123"}
    ).status_code == 200

    # Old tokens are invalidated by the token-version bump.
    assert client.get("/api/auth/me", headers=auth_headers(data["access_token"])).status_code == 401


def test_logout_all_invalidates_existing_tokens(client, user_token):
    headers = auth_headers(user_token)
    assert client.get("/api/auth/me", headers=headers).status_code == 200
    assert client.post("/api/auth/logout-all", headers=headers).status_code == 200
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_change_password(client, user_token):
    headers = auth_headers(user_token)
    wrong = client.post(
        "/api/auth/change-password",
        json={"current_password": "Nope1234", "new_password": "Another123"},
        headers=headers,
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/api/auth/change-password",
        json={"current_password": "Password123", "new_password": "Another123"},
        headers=headers,
    )
    assert ok.status_code == 200
