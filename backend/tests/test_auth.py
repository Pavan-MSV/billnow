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


def test_otp_flow_and_attempt_limit(client):
    email = "otp-limit-test@example.com"
    phone = "+919876543210"

    # Send OTP via Email
    send_resp = client.post("/api/auth/send-otp", json={"email": email, "phone": phone, "channel": "email"})
    assert send_resp.status_code == 200
    assert send_resp.json()["channel"] == "email"
    otp = send_resp.json().get("dev_otp")
    assert otp is not None

    # Invalid attempt 1: 400 with 2 remaining
    bad1 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000000"})
    assert bad1.status_code == 400
    assert "2 attempt(s) remaining" in bad1.json()["detail"]

    # Invalid attempt 2: 400 with 1 remaining
    bad2 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000001"})
    assert bad2.status_code == 400
    assert "1 attempt(s) remaining" in bad2.json()["detail"]

    # Invalid attempt 3: 429 Too Many Requests (revoked)
    bad3 = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000002"})
    assert bad3.status_code == 429
    assert "revoked" in bad3.json()["detail"]

    # Subsequent attempt with even the right OTP fails because it was revoked
    bad_after = client.post("/api/auth/verify-otp", json={"email": email, "otp": otp})
    assert bad_after.status_code == 400


def test_otp_send_via_sms_channel(client, monkeypatch):
    from app.core.config import settings

    email = "otp-sms-test@example.com"
    phone = "+919876543210"

    # Send OTP via SMS channel
    send_resp = client.post("/api/auth/send-otp", json={"email": email, "phone": phone, "channel": "sms"})
    assert send_resp.status_code == 200
    body = send_resp.json()
    assert body["channel"] == "sms"
    assert "Verification code sent via SMS" in body["message"]
    assert body.get("dev_otp") is not None


def test_health_check_probes_database(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_security_headers_present(client):
    response = client.get("/api/health")
    headers = response.headers
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert headers["x-xss-protection"] == "1; mode=block"
    assert headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["permissions-policy"]
    assert "default-src 'self'" in headers["content-security-policy"]


def test_register_rejects_overlong_password(client):
    overlong = "P" * 75 + "1a"
    response = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "overlong@example.com", "password": overlong},
    )
    assert response.status_code == 422
