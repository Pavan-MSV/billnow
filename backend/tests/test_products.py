"""Product CRUD, search/filter and authorization tests."""

from datetime import date, timedelta

from tests.conftest import auth_headers, create_product


def test_categories_are_listed(client):
    response = client.get("/api/products/categories")
    assert response.status_code == 200
    categories = response.json()
    assert "Television" in categories
    assert "Other" in categories


def test_create_product_autocalculates_warranty_end(client, user_token):
    product = create_product(client, user_token, purchase_date="2026-01-12", warranty_period_months=24)
    # 12 Jan 2026 + 24 months = 12 Jan 2028
    assert product["warranty_start_date"] == "2026-01-12"
    assert product["warranty_end_date"] == "2028-01-12"
    assert product["warranty_status"] in {"active", "expiring_soon", "expired"}
    assert isinstance(product["warranty_days_remaining"], int)


def test_explicit_warranty_end_date_is_respected(client, user_token):
    product = create_product(
        client,
        user_token,
        purchase_date="2026-01-12",
        warranty_period_months=24,
        warranty_end_date="2027-06-30",
    )
    assert product["warranty_end_date"] == "2027-06-30"


def test_create_rejects_negative_price(client, user_token):
    response = client.post(
        "/api/products",
        json={"name": "Bad", "category": "Other", "purchase_price": -5},
        headers=auth_headers(user_token),
    )
    assert response.status_code == 422


def test_get_update_delete_product(client, user_token):
    created = create_product(client, user_token)
    product_id = created["id"]

    fetched = client.get(f"/api/products/{product_id}", headers=auth_headers(user_token))
    assert fetched.status_code == 200
    assert fetched.json()["name"] == created["name"]

    updated = client.put(
        f"/api/products/{product_id}",
        json={"name": "Samsung TV (updated)", "purchase_price": 41000},
        headers=auth_headers(user_token),
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Samsung TV (updated)"
    assert updated.json()["purchase_price"] == 41000.0

    deleted = client.delete(f"/api/products/{product_id}", headers=auth_headers(user_token))
    assert deleted.status_code == 204
    assert client.get(f"/api/products/{product_id}", headers=auth_headers(user_token)).status_code == 404


def test_search_across_fields(client, user_token):
    create_product(client, user_token, name="Samsung TV", brand="Samsung", seller="Croma")
    create_product(client, user_token, name="Dell Laptop", brand="Dell", category="Laptop", seller="Dell India")

    assert client.get("/api/products?search=samsung", headers=auth_headers(user_token)).json()["total"] == 1
    assert client.get("/api/products?search=dell", headers=auth_headers(user_token)).json()["total"] == 1
    assert client.get("/api/products?search=croma", headers=auth_headers(user_token)).json()["total"] == 1
    assert client.get("/api/products?search=zzz", headers=auth_headers(user_token)).json()["total"] == 0


def test_category_filter_and_sort(client, user_token):
    create_product(client, user_token, name="TV", category="Television", purchase_price=45000)
    create_product(
        client, user_token, name="Laptop", category="Laptop", purchase_price=135000, purchase_date="2026-05-01"
    )

    filtered = client.get("/api/products?category=Laptop", headers=auth_headers(user_token)).json()
    assert filtered["total"] == 1

    by_price_desc = client.get(
        "/api/products?sort=price&order=desc", headers=auth_headers(user_token)
    ).json()
    assert by_price_desc["items"][0]["name"] == "Laptop"


def test_warranty_status_filter(client, user_token):
    expired = date.today() - timedelta(days=400)
    create_product(
        client,
        user_token,
        name="Old Fridge",
        warranty_start_date=expired.isoformat(),
        warranty_end_date=(date.today() - timedelta(days=10)).isoformat(),
    )
    create_product(
        client,
        user_token,
        name="New Fridge",
        warranty_end_date=(date.today() + timedelta(days=800)).isoformat(),
    )

    expired_items = client.get(
        "/api/products?warranty_status=expired", headers=auth_headers(user_token)
    ).json()
    assert expired_items["total"] == 1
    assert expired_items["items"][0]["name"] == "Old Fridge"


def test_pagination(client, user_token):
    for index in range(5):
        create_product(client, user_token, name=f"Product {index}")

    first = client.get("/api/products?page=1&page_size=2", headers=auth_headers(user_token)).json()
    assert first["total"] == 5
    assert len(first["items"]) == 2

    last = client.get("/api/products?page=3&page_size=2", headers=auth_headers(user_token)).json()
    assert len(last["items"]) == 1


def test_user_cannot_access_another_users_product(client, user_token, second_user_token):
    created = create_product(client, user_token)
    product_id = created["id"]

    # Another user gets a 404 (existence is never revealed).
    assert client.get(
        f"/api/products/{product_id}", headers=auth_headers(second_user_token)
    ).status_code == 404
    assert client.put(
        f"/api/products/{product_id}", json={"name": "Hacked"}, headers=auth_headers(second_user_token)
    ).status_code == 404
    assert client.delete(
        f"/api/products/{product_id}", headers=auth_headers(second_user_token)
    ).status_code == 404

    # And their own list stays empty.
    assert client.get("/api/products", headers=auth_headers(second_user_token)).json()["total"] == 0


def test_products_require_authentication(client):
    assert client.get("/api/products").status_code == 401
    assert client.post("/api/products", json={"name": "x", "category": "Other"}).status_code == 401
