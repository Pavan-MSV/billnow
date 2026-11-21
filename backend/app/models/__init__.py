"""Import all models so that Alembic / metadata sees every table."""

from app.db.base import Base
from app.models.enums import AccountType, NotificationType, Theme, WarrantyStatus
from app.models.invoice import Invoice
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.product import Product
from app.models.service_record import ServiceRecord
from app.models.user import User

__all__ = [
    "Base",
    "User",
    "Product",
    "Invoice",
    "ServiceRecord",
    "Notification",
    "NotificationPreference",
    "AccountType",
    "WarrantyStatus",
    "NotificationType",
    "Theme",
]
