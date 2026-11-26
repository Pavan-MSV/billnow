"""Upload validation helpers (file type + size)."""

from pathlib import Path

from fastapi import HTTPException, status

from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
_NEUTRAL_CONTENT_TYPES = {"application/octet-stream", "binary/octet-stream", ""}


def validate_invoice_upload(
    filename: str, content_type: str | None, size: int, data: bytes | None = None
) -> None:
    """Raise a 400/413 HTTPException when the upload is not acceptable."""
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A file name is required")

    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed formats: PDF, JPG, JPEG, PNG.",
        )

    normalized = (content_type or "").lower()
    if normalized not in _NEUTRAL_CONTENT_TYPES and normalized not in settings.allowed_upload_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed formats: PDF, JPG, JPEG, PNG.",
        )

    if size <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty")

    if size > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Magic byte inspection for file integrity
    if data is not None and len(data) > 0:
        is_valid = False
        if extension == ".pdf" and data.startswith(b"%PDF"):
            is_valid = True
        elif extension in {".jpg", ".jpeg"} and data.startswith(b"\xff\xd8\xff"):
            is_valid = True
        elif extension == ".png" and data.startswith(b"\x89PNG\r\n\x1a\n"):
            is_valid = True

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corrupted or invalid file content. The file does not match the expected {extension.upper()} format.",
            )
