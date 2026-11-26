"""Storage abstraction.

BillNow never stores invoice binaries inside PostgreSQL — only the object
key/path and metadata. Any backend implementing this interface can be dropped
in via the ``STORAGE_BACKEND`` setting.
"""

from abc import ABC, abstractmethod


class StorageBackend(ABC):
    name: str = "base"

    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str) -> str:
        """Persist ``data`` under ``key`` and return the stored key."""

    @abstractmethod
    def read(self, key: str) -> bytes:
        """Return the raw bytes stored under ``key``."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Delete the object stored under ``key`` (no-op if missing)."""

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Return True if an object exists under ``key``."""

    def url(self, key: str) -> str | None:
        """Return a public/derived URL for the object, when the backend supports it."""
        return None

    def generate_presigned_url(self, key: str, expires_in: int = 900) -> str | None:
        """Generate a temporary signed download URL when supported by the backend (e.g. S3/Cloudflare R2)."""
        return None


def build_invoice_key(user_id, product_id, filename: str) -> str:
    """Deterministic-yet-unique object key for an invoice file."""
    from uuid import uuid4

    safe_name = "".join(c for c in filename if c.isalnum() or c in "._-") or "invoice"
    return f"invoices/{user_id}/{product_id}/{uuid4().hex}-{safe_name}"
