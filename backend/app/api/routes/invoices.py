"""Invoice routes: upload, view, download, replace, delete."""

import uuid
from urllib.parse import quote

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.api.deps import CurrentUser, DbSession
from app.api.routes.products import get_owned_product
from app.core.config import settings
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceOut, PresignedUrlResponse
from app.services.storage import build_invoice_key, get_storage
from app.services.uploads import validate_invoice_upload

router = APIRouter(prefix="/products", tags=["invoices"])


def _file_response(invoice: Invoice, disposition: str) -> Response:
    storage = get_storage()
    try:
        data = storage.read(invoice.storage_path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invoice file could not be found"
        ) from exc

    headers = {
        "Content-Disposition": f"{disposition}; filename*=UTF-8''{quote(invoice.file_name)}",
        "Cache-Control": "private, no-store",
    }
    return Response(content=data, media_type=invoice.file_type, headers=headers)


@router.post("/{product_id}/invoice", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def upload_invoice(
    product_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
) -> InvoiceOut:
    product = get_owned_product(db, current_user.id, product_id)

    data = file.file.read()
    filename = file.filename or "invoice"
    validate_invoice_upload(filename, file.content_type, len(data), data)

    storage = get_storage()
    key = build_invoice_key(current_user.id, product.id, filename)
    storage.save(key, data, file.content_type or "application/octet-stream")

    if product.invoice is not None:
        # Replace: drop the previous object, reuse the row.
        invoice = product.invoice
        try:
            storage.delete(invoice.storage_path)
        except Exception:  # pragma: no cover - best effort cleanup
            pass
        invoice.file_name = filename
        invoice.file_type = file.content_type or "application/octet-stream"
        invoice.file_size = len(data)
        invoice.storage_path = key
        invoice.storage_backend = storage.name
    else:
        invoice = Invoice(
            product_id=product.id,
            file_name=filename,
            file_type=file.content_type or "application/octet-stream",
            file_size=len(data),
            storage_path=key,
            storage_backend=storage.name,
        )
        db.add(invoice)

    db.commit()
    db.refresh(invoice)
    return InvoiceOut.model_validate(invoice)


@router.get("/{product_id}/invoice", response_model=InvoiceOut)
def get_invoice(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> InvoiceOut:
    product = get_owned_product(db, current_user.id, product_id)
    if product.invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice uploaded")
    return InvoiceOut.model_validate(product.invoice)


@router.get("/{product_id}/invoice/url", response_model=PresignedUrlResponse)
def get_invoice_presigned_url(
    product_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> PresignedUrlResponse:
    """Generate a temporary signed download URL for private Cloudflare R2 / S3 access."""
    product = get_owned_product(db, current_user.id, product_id)
    if product.invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice uploaded")

    storage = get_storage()
    signed = storage.generate_presigned_url(product.invoice.storage_path, expires_in=900)
    if signed:
        return PresignedUrlResponse(url=signed, expires_in=900)

    # Fallback to backend streaming URL when storage backend doesn't support S3 presigned URLs (e.g. local in dev)
    fallback = f"{settings.API_PREFIX}/products/{product.id}/invoice/view"
    return PresignedUrlResponse(url=fallback, expires_in=900)


@router.get("/{product_id}/invoice/view")
def view_invoice(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> Response:
    product = get_owned_product(db, current_user.id, product_id)
    if product.invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice uploaded")
    return _file_response(product.invoice, "inline")


@router.get("/{product_id}/invoice/download")
def download_invoice(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> Response:
    product = get_owned_product(db, current_user.id, product_id)
    if product.invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice uploaded")
    return _file_response(product.invoice, "attachment")


@router.delete("/{product_id}/invoice", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    product = get_owned_product(db, current_user.id, product_id)
    if product.invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No invoice uploaded")

    try:
        get_storage().delete(product.invoice.storage_path)
    except Exception:  # pragma: no cover - best effort cleanup
        pass

    db.delete(product.invoice)
    db.commit()
