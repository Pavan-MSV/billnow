"""Service history routes."""

import uuid
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.routes.products import get_owned_product
from app.models.service_record import ServiceRecord
from app.schemas.service import ServiceRecordCreate, ServiceRecordOut, ServiceRecordUpdate

products_router = APIRouter(prefix="/products", tags=["services"])
services_router = APIRouter(prefix="/services", tags=["services"])


def _get_owned_service(db, user_id, service_id: uuid.UUID) -> ServiceRecord:
    record = db.get(ServiceRecord, service_id)
    if record is None or record.product is None or record.product.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service record not found")
    return record


@products_router.get("/{product_id}/services", response_model=list[ServiceRecordOut])
def list_services(product_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> list[ServiceRecordOut]:
    product = get_owned_product(db, current_user.id, product_id)
    records = (
        db.execute(
            select(ServiceRecord)
            .where(ServiceRecord.product_id == product.id)
            .order_by(ServiceRecord.service_date.desc())
        )
        .scalars()
        .all()
    )
    return [ServiceRecordOut.model_validate(r) for r in records]


@products_router.post(
    "/{product_id}/services", response_model=ServiceRecordOut, status_code=status.HTTP_201_CREATED
)
def create_service(
    product_id: uuid.UUID, payload: ServiceRecordCreate, current_user: CurrentUser, db: DbSession
) -> ServiceRecordOut:
    product = get_owned_product(db, current_user.id, product_id)

    record = ServiceRecord(
        product_id=product.id,
        service_date=payload.service_date,
        service_type=payload.service_type,
        provider=payload.provider,
        cost=Decimal(str(payload.cost)) if payload.cost is not None else None,
        description=payload.description,
        next_service_date=payload.next_service_date,
        notes=payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ServiceRecordOut.model_validate(record)


@services_router.put("/{service_id}", response_model=ServiceRecordOut)
def update_service(
    service_id: uuid.UUID, payload: ServiceRecordUpdate, current_user: CurrentUser, db: DbSession
) -> ServiceRecordOut:
    record = _get_owned_service(db, current_user.id, service_id)

    data = payload.model_dump(exclude_unset=True)
    if "cost" in data and data["cost"] is not None:
        data["cost"] = Decimal(str(data["cost"]))

    for field, value in data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return ServiceRecordOut.model_validate(record)


@services_router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    record = _get_owned_service(db, current_user.id, service_id)
    db.delete(record)
    db.commit()
