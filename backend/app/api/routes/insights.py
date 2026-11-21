"""Insights / analytics route."""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.dashboard import InsightsResponse
from app.services import analytics

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def insights(current_user: CurrentUser, db: DbSession) -> InsightsResponse:
    data = analytics.insights(db, current_user.id, current_user.currency)
    return InsightsResponse(**data)
