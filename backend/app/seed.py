"""Development seed data.

Creates tables (for convenience) and inserts a demo user plus sample products.
Refuses to run in production unless explicitly forced.

Usage:
    python -m app.seed
    python -m app.seed --force
"""

import argparse
import sys
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.product import Product
from app.models.service_record import ServiceRecord
from app.models.user import User
from app.services.notifications import get_or_create_preferences

logger = get_logger(__name__)

DEMO_EMAIL = "demo@billnow.app"
DEMO_PASSWORD = "Demo1234"


def _months_ago(months: int) -> date:
    today = date.today()
    month_index = today.month - 1 - months
    year = today.year + month_index // 12
    month = month_index % 12 + 1
    day = min(today.day, 28)
    return date(year, month, day)


def seed(force: bool = False, create_demo: bool = False) -> None:
    if settings.is_production and not force:
        print("Refusing to seed a production environment. Re-run with --force to override.")
        sys.exit(1)

    configure_logging()
    Base.metadata.create_all(bind=engine)

    if not create_demo:
        print("Database schema synchronized. Demo account creation disabled.")
        return

    db = SessionLocal()
    try:
        existing = db.execute(
            select(User).where(func.lower(User.email) == DEMO_EMAIL)
        ).scalar_one_or_none()
        if existing is not None:
            if not existing.phone:
                existing.phone = "+91 98765 43210"
                db.commit()
            print(f"Demo user {DEMO_EMAIL} already exists — updated phone.")
            return

        user = User(
            name="Pavan Kumar",
            email=DEMO_EMAIL,
            phone="+91 98765 43210",
            password_hash=hash_password(DEMO_PASSWORD),
            account_type="personal",
            currency="INR",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        get_or_create_preferences(db, user)

        today = date.today()

        samples = [
            {
                "name": "Samsung 55 inch Smart TV",
                "category": "Television",
                "brand": "Samsung",
                "model_number": "UA55CU8000",
                "serial_number": "ABC123456",
                "months_old": 20,
                "purchase_price": Decimal("45000.00"),
                "warranty_months": 24,
                "seller": "Croma",
                "invoice_number": "INV-12345",
            },
            {
                "name": "LG Washing Machine",
                "category": "Washing Machine",
                "brand": "LG",
                "model_number": "FHM1207ZDL",
                "serial_number": "LGWM7788",
                "months_old": 30,
                "purchase_price": Decimal("32000.00"),
                "warranty_months": 24,
                "seller": "Vijay Sales",
                "invoice_number": "VS-98211",
            },
            {
                "name": "Dell XPS 13 Laptop",
                "category": "Laptop",
                "brand": "Dell",
                "model_number": "XPS 13 9340",
                "serial_number": "DLXPS9340",
                "months_old": 3,
                "purchase_price": Decimal("135000.00"),
                "warranty_months": 12,
                "seller": "Dell India",
                "invoice_number": "DELL-4410",
            },
            {
                "name": "Whirlpool Refrigerator",
                "category": "Refrigerator",
                "brand": "Whirlpool",
                "model_number": "IF INV CNV 278",
                "serial_number": "WP278123",
                "months_old": 26,
                "purchase_price": Decimal("28900.00"),
                "warranty_months": 24,
                "seller": "Reliance Digital",
                "invoice_number": "RD-55231",
            },
            {
                "name": "Sony WH-1000XM5 Headphones",
                "category": "Audio",
                "brand": "Sony",
                "model_number": "WH-1000XM5",
                "serial_number": "SNXM5-0099",
                "months_old": 8,
                "purchase_price": Decimal("26990.00"),
                "warranty_months": 12,
                "seller": "Amazon",
                "invoice_number": "AMZ-110293",
            },
            {
                "name": "LG 1.5 Ton Split AC",
                "category": "Air Conditioner",
                "brand": "LG",
                "model_number": "PS-Q19YNZE",
                "serial_number": "LGAC5567",
                "months_old": 18,
                "purchase_price": Decimal("48000.00"),
                "warranty_months": 24,
                "seller": "Croma",
                "invoice_number": "INV-77812",
            },
        ]

        for sample in samples:
            months_old = sample.pop("months_old")
            purchase_date = _months_ago(months_old)
            warranty_months = sample.pop("warranty_months")

            product = Product(
                user_id=user.id,
                purchase_date=purchase_date,
                currency="INR",
                warranty_start_date=purchase_date,
                warranty_period_months=warranty_months,
                warranty_end_date=_add_months(purchase_date, warranty_months),
                **sample,
            )
            db.add(product)

        db.commit()

        # One service record example for the AC.
        ac = db.execute(
            select(Product).where(Product.user_id == user.id, Product.name.like("LG 1.5%"))
        ).scalar_one_or_none()
        if ac is not None:
            db.add(
                ServiceRecord(
                    product_id=ac.id,
                    service_date=today - timedelta(days=150),
                    service_type="General servicing",
                    provider="ABC Services",
                    cost=Decimal("900.00"),
                    description="Coil cleaning and gas top-up.",
                    next_service_date=today + timedelta(days=35),
                )
            )
            db.commit()

        print("Seed complete.")
        print(f"  Email:    {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")
    finally:
        db.close()


def _add_months(start: date, months: int) -> date:
    import calendar

    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(start.day, last_day))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed BillNow development data")
    parser.add_argument("--force", action="store_true", help="Allow running in production")
    parser.add_argument("--demo", action="store_true", help="Explicitly create demo account")
    args = parser.parse_args()
    seed(force=args.force, create_demo=args.demo)
