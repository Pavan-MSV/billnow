"""Firebase Storage backend (optional dependency).

Firebase Storage is backed by Google Cloud Storage; this adapter lets a
future React Native / FCM build share the same storage bucket.
"""

from app.services.storage.base import StorageBackend


class FirebaseStorage(StorageBackend):
    name = "firebase"

    def __init__(self, bucket: str, public_url: str | None = None) -> None:
        try:
            import firebase_admin
            from firebase_admin import storage as fb_storage
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "firebase-admin is required for the Firebase storage backend"
            ) from exc

        if not firebase_admin._apps:  # noqa: SLF001
            firebase_admin.initialize_app()

        self.public_url = public_url.rstrip("/") if public_url else None
        self._bucket = fb_storage.bucket(bucket)

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
