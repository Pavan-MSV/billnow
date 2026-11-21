"""Local filesystem storage backend (default for development)."""

import os
from pathlib import Path

from app.services.storage.base import StorageBackend


class LocalStorage(StorageBackend):
    name = "local"

    def __init__(self, root_dir: str) -> None:
        self.root = Path(root_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        # Prevent path traversal outside the configured root.
        full = (self.root / key).resolve()
        if not str(full).startswith(str(self.root)):
            raise ValueError("Invalid storage key")
        return full

    def save(self, key: str, data: bytes, content_type: str) -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return key

    def read(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            os.remove(path)

    def exists(self, key: str) -> bool:
        return self._path(key).exists()
