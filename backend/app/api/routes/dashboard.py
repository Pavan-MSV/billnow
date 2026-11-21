"""Dashboard summary + upcoming expirations."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.dashboard import DashboardSummary, UpcomingExpiration
from app.services import analytics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(current_user: CurrentUser, db: DbSession) -> DashboardSummary:
    return analytics.dashboard_summary(db, current_user.id, current_user.currency)


@router.get("/upcoming", response_model=list[UpcomingExpiration])
def upcoming(
    current_user: CurrentUser,
    db: DbSession,
    days: int = Query(default=90, ge=1, le=3650),
) -> list[UpcomingExpiration]:
    return analytics.upcoming_expirations(db, current_user.id, days=days)
