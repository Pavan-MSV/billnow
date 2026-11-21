"""Enumerations shared across models and schemas."""

import enum


class AccountType(str, enum.Enum):
    personal = "personal"
    business = "business"


class WarrantyStatus(str, enum.Enum):
    active = "active"
    expiring_soon = "expiring_soon"
    expired = "expired"
    unknown = "unknown"


class NotificationType(str, enum.Enum):
    warranty_expiring = "warranty_expiring"
    warranty_expired = "warranty_expired"


class Theme(str, enum.Enum):
    light = "light"
    dark = "dark"
    system = "system"
