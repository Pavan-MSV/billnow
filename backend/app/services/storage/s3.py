"""S3-compatible storage backend.

Works with AWS S3 as well as S3-compatible providers such as Cloudflare R2
and DigitalOcean Spaces (set ``STORAGE_ENDPOINT_URL``).
"""

from app.services.storage.base import StorageBackend


class S3Storage(StorageBackend):
    name = "s3"

    def __init__(
        self,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str | None = None,
        endpoint_url: str | None = None,
        public_url: str | None = None,
    ) -> None:
        try:
            import boto3
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError("boto3 is required for the S3 storage backend") from exc

        self.bucket = bucket
        self.public_url = public_url.rstrip("/") if public_url else None
        self._client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            endpoint_url=endpoint_url,
        )

    def save(self, key: str, data: bytes, content_type: str) -> str:
        self._client.put_object(
            Bucket=self.bucket, Key=key, Body=data, ContentType=content_type
        )
        return key

    def read(self, key: str) -> bytes:
        response = self._client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self.bucket, Key=key)

    def exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    def url(self, key: str) -> str | None:
        if self.public_url:
            return f"{self.public_url}/{key}"
        return None
