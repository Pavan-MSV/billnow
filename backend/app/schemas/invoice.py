"""Invoice schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    file_name: str
    file_type: str
    file_size: int
    storage_path: str
    uploaded_at: datetime
