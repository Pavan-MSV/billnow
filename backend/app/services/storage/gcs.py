"""Google Cloud Storage backend (optional dependency)."""

from app.services.storage.base import StorageBackend


class GCSStorage(StorageBackend):
    name = "gcs"

    def __init__(self, bucket: str, public_url: str | None = None) -> None:
        try:
            from google.cloud import storage as gcs
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "google-cloud-storage is required for the GCS storage backend"
            ) from exc

        self.bucket_name = bucket
        self.public_url = public_url.rstrip("/") if public_url else None
        self._client = gcs.Client()
        self._bucket = self._client.bucket(bucket)

    def save(self, key: str, data: bytes, content_type: str) -> str:
        blob = self._bucket.blob(key)
        blob.upload_from_string(data, content_type=content_type)
        return key

    def read(self, key: str) -> bytes:
        return self._bucket.blob(key).download_as_bytes()

    def delete(self, key: str) -> None:
        self._bucket.blob(key).delete()

    def exists(self, key: str) -> bool:
        return self._bucket.blob(key).exists()

    def url(self, key: str) -> str | None:
        if self.public_url:
            return f"{self.public_url}/{key}"
        return None
