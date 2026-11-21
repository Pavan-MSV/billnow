"""Storage backend factory driven by the ``STORAGE_BACKEND`` setting."""

from functools import lru_cache

from app.core.config import settings
from app.services.storage.base import StorageBackend


def _build() -> StorageBackend:
    backend = settings.STORAGE_BACKEND.lower()

    if backend == "local":
        from app.services.storage.local import LocalStorage

        return LocalStorage(settings.STORAGE_LOCAL_DIR)

    if backend in {"s3", "r2"}:
        from app.services.storage.s3 import S3Storage

        if not (settings.STORAGE_BUCKET and settings.STORAGE_ACCESS_KEY and settings.STORAGE_SECRET_KEY):
            raise RuntimeError("S3/R2 storage requires STORAGE_BUCKET, STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY")

        return S3Storage(
            bucket=settings.STORAGE_BUCKET,
            access_key=settings.STORAGE_ACCESS_KEY,
            secret_key=settings.STORAGE_SECRET_KEY,
            region=settings.STORAGE_REGION,
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            public_url=settings.STORAGE_PUBLIC_URL,
        )

    if backend == "gcs":
        from app.services.storage.gcs import GCSStorage

        if not settings.STORAGE_BUCKET:
            raise RuntimeError("GCS storage requires STORAGE_BUCKET")
        return GCSStorage(bucket=settings.STORAGE_BUCKET, public_url=settings.STORAGE_PUBLIC_URL)

    if backend == "firebase":
        from app.services.storage.firebase import FirebaseStorage

        if not settings.STORAGE_BUCKET:
            raise RuntimeError("Firebase storage requires STORAGE_BUCKET")
        return FirebaseStorage(bucket=settings.STORAGE_BUCKET, public_url=settings.STORAGE_PUBLIC_URL)

    raise RuntimeError(f"Unsupported STORAGE_BACKEND: {settings.STORAGE_BACKEND!r}")


@lru_cache
def get_storage() -> StorageBackend:
    return _build()
