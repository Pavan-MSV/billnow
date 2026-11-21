"""Warranty listing routes (status is always computed from today's date)."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.enums import WarrantyStatus
from app.schemas.dashboard import WarrantyItem, WarrantyListResponse
from app.services import analytics

router = APIRouter(prefix="/warranties", tags=["warranties"])

_VALID_STATUSES = {s.value for s in WarrantyStatus}


@router.get("", response_model=WarrantyListResponse)
def list_warranties(
    current_user: CurrentUser,
    db: DbSession,
    status: str | None = Query(default=None),
) -> WarrantyListResponse:
    filter_status: WarrantyStatus | None = None
    if status and status.lower() in _VALID_STATUSES:
        filter_status = WarrantyStatus(status.lower())

    return analytics.warranty_list(db, current_user.id, status=filter_status)


@router.get("/expiring", response_model=list[WarrantyItem])
def expiring_warranties(current_user: CurrentUser, db: DbSession) -> list[WarrantyItem]:
    return analytics.warranty_list(db, current_user.id, status=WarrantyStatus.expiring_soon).items


@router.get("/expired", response_model=list[WarrantyItem])
def expired_warranties(current_user: CurrentUser, db: DbSession) -> list[WarrantyItem]:
    return analytics.warranty_list(db, current_user.id, status=WarrantyStatus.expired).items
