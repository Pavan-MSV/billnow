"""Invoice upload / view / download / delete + authorization tests."""

from tests.conftest import auth_headers, create_product

PDF_BYTES = b"%PDF-1.4\n% BillNow test invoice\n1 0 obj\n<<>>\nendobj\n%%EOF\n"


def _upload(client, token, product_id, filename="invoice.pdf", content_type="application/pdf", data=PDF_BYTES):
    return client.post(
        f"/api/products/{product_id}/invoice",
        files={"file": (filename, data, content_type)},
        headers=auth_headers(token),
    )


def test_upload_returns_invoice_metadata(client, user_token):
    product = create_product(client, user_token)
    response = _upload(client, user_token, product["id"])

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["file_name"] == "invoice.pdf"
    assert body["file_type"] == "application/pdf"
    assert body["file_size"] == len(PDF_BYTES)
    assert body["storage_path"].startswith("invoices/")

    # The product now exposes the invoice.
    detail = client.get(f"/api/products/{product['id']}", headers=auth_headers(user_token)).json()
    assert detail["invoice"]["id"] == body["id"]


def test_get_metadata_when_no_invoice(client, user_token):
    product = create_product(client, user_token)
    assert client.get(
        f"/api/products/{product['id']}/invoice", headers=auth_headers(user_token)
    ).status_code == 404


def test_view_and_download_invoice(client, user_token):
    product = create_product(client, user_token)
    _upload(client, user_token, product["id"])
    headers = auth_headers(user_token)

    viewed = client.get(f"/api/products/{product['id']}/invoice/view", headers=headers)
    assert viewed.status_code == 200
    assert viewed.content == PDF_BYTES
    assert "inline" in viewed.headers["content-disposition"]

    downloaded = client.get(f"/api/products/{product['id']}/invoice/download", headers=headers)
    assert downloaded.status_code == 200
    assert downloaded.content == PDF_BYTES
    assert "attachment" in downloaded.headers["content-disposition"]


def test_replace_invoice(client, user_token):
    product = create_product(client, user_token)
    first = _upload(client, user_token, product["id"]).json()

    second = _upload(
        client, user_token, product["id"], filename="invoice-v2.pdf", data=b"%PDF-1.4 v2"
    )
    assert second.status_code == 201
    assert second.json()["file_name"] == "invoice-v2.pdf"
    assert second.json()["id"] == first["id"]  # same row, replaced


def test_delete_invoice(client, user_token):
    product = create_product(client, user_token)
    _upload(client, user_token, product["id"])
    headers = auth_headers(user_token)

    assert client.delete(f"/api/products/{product['id']}/invoice", headers=headers).status_code == 204
    assert client.get(f"/api/products/{product['id']}/invoice", headers=headers).status_code == 404


def test_rejects_corrupted_or_mismatched_magic_bytes(client, user_token):
    product = create_product(client, user_token)
    response = _upload(
        client, user_token, product["id"], filename="fake.pdf", data=b"MALICIOUS_NON_PDF_BINARY_DATA"
    )
    assert response.status_code == 400
    assert "Corrupted or invalid file content" in response.json()["detail"]


def test_invoice_presigned_url_endpoint(client, user_token, second_user_token):
    product = create_product(client, user_token)
    _upload(client, user_token, product["id"])

    # Owner can retrieve download URL
    res = client.get(f"/api/products/{product['id']}/invoice/url", headers=auth_headers(user_token))
    assert res.status_code == 200
    assert "url" in res.json()
    assert res.json()["expires_in"] == 900

    # Non-owner cannot access (404)
    res_other = client.get(
        f"/api/products/{product['id']}/invoice/url", headers=auth_headers(second_user_token)
    )
    assert res_other.status_code == 404


def test_rejects_oversized_file(client, user_token, monkeypatch):
    from app.core.config import settings

    product = create_product(client, user_token)
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0)
    response = _upload(client, user_token, product["id"], data=b"x" * 2048)
    assert response.status_code == 413


def test_invoice_is_private_to_owner(client, user_token, second_user_token):
    product = create_product(client, user_token)
    _upload(client, user_token, product["id"])

    other = auth_headers(second_user_token)
    assert client.get(f"/api/products/{product['id']}/invoice", headers=other).status_code == 404
    assert client.get(f"/api/products/{product['id']}/invoice/view", headers=other).status_code == 404
    assert client.get(f"/api/products/{product['id']}/invoice/download", headers=other).status_code == 404
    assert client.delete(f"/api/products/{product['id']}/invoice", headers=other).status_code == 404
    assert _upload(client, second_user_token, product["id"]).status_code == 404
