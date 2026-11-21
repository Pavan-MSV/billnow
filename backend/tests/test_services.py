"""Service history CRUD + authorization tests."""

from tests.conftest import auth_headers, create_product


def _add_service(client, token, product_id, **overrides):
    payload = {
        "service_date": "2026-06-10",
        "service_type": "General servicing",
        "provider": "ABC Services",
        "cost": 900,
        "description": "Coil cleaning",
        "next_service_date": "2026-12-10",
    }
    payload.update(overrides)
    return client.post(
        f"/api/products/{product_id}/services", json=payload, headers=auth_headers(token)
    )


def test_create_and_list_service_records(client, user_token):
    product = create_product(client, user_token)
    created = _add_service(client, user_token, product["id"])
    assert created.status_code == 201, created.text
    assert created.json()["provider"] == "ABC Services"
    assert created.json()["cost"] == 900.0

    listed = client.get(f"/api/products/{product['id']}/services", headers=auth_headers(user_token))
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_service_record_appears_on_product_detail(client, user_token):
    product = create_product(client, user_token)
    _add_service(client, user_token, product["id"])

    detail = client.get(f"/api/products/{product['id']}", headers=auth_headers(user_token)).json()
    assert len(detail["services"]) == 1


def test_update_and_delete_service_record(client, user_token):
    product = create_product(client, user_token)
    service_id = _add_service(client, user_token, product["id"]).json()["id"]

    updated = client.put(
        f"/api/services/{service_id}", json={"cost": 1500, "provider": "XYZ Services"}, headers=auth_headers(user_token)
    )
    assert updated.status_code == 200
    assert updated.json()["cost"] == 1500.0
    assert updated.json()["provider"] == "XYZ Services"

    assert client.delete(f"/api/services/{service_id}", headers=auth_headers(user_token)).status_code == 204
    assert client.get(f"/api/products/{product['id']}/services", headers=auth_headers(user_token)).json() == []


def test_service_records_are_private_to_owner(client, user_token, second_user_token):
    product = create_product(client, user_token)
    service_id = _add_service(client, user_token, product["id"]).json()["id"]

    other = auth_headers(second_user_token)
    assert client.get(f"/api/products/{product['id']}/services", headers=other).status_code == 404
    assert _add_service(client, second_user_token, product["id"]).status_code == 404
    assert client.put(f"/api/services/{service_id}", json={"cost": 1}, headers=other).status_code == 404
    assert client.delete(f"/api/services/{service_id}", headers=other).status_code == 404
