"""Pydantic schemas."""

from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    TokenResponse,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.dashboard import (
    CategoryAmount,
    CategoryCount,
    DashboardSummary,
    InsightsResponse,
    UpcomingExpiration,
    WarrantyItem,
    WarrantyListResponse,
    WarrantySplit,
)
from app.schemas.invoice import InvoiceOut
from app.schemas.notification import (
    NotificationOut,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
    UnreadCountResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductUpdate,
    product_to_out,
)
from app.schemas.service import ServiceRecordCreate, ServiceRecordOut, ServiceRecordUpdate
from app.schemas.user import UserOut, UserUpdate

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "RefreshRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "ChangePasswordRequest",
    "TokenResponse",
    "TokenPair",
    "MessageResponse",
    "PaginatedResponse",
    "UserOut",
    "UserUpdate",
    "DashboardSummary",
    "UpcomingExpiration",
    "WarrantyItem",
    "WarrantyListResponse",
    "WarrantySplit",
    "CategoryCount",
    "CategoryAmount",
    "InsightsResponse",
    "InvoiceOut",
    "NotificationOut",
    "NotificationPreferenceOut",
    "NotificationPreferenceUpdate",
    "UnreadCountResponse",
    "ProductCreate",
    "ProductUpdate",
    "ProductOut",
    "ProductListResponse",
    "product_to_out",
    "ServiceRecordCreate",
    "ServiceRecordUpdate",
    "ServiceRecordOut",
]
