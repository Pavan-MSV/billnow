"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-12

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ---------------------------------------------------------------- users
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("account_type", sa.String(length=20), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("theme", sa.String(length=10), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("token_version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------- products
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("brand", sa.String(length=120), nullable=True),
        sa.Column("model_number", sa.String(length=120), nullable=True),
        sa.Column("serial_number", sa.String(length=120), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("purchase_price", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("seller", sa.String(length=160), nullable=True),
        sa.Column("invoice_number", sa.String(length=120), nullable=True),
        sa.Column("warranty_start_date", sa.Date(), nullable=True),
        sa.Column("warranty_period_months", sa.Integer(), nullable=True),
        sa.Column("warranty_end_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_user_id", "products", ["user_id"])
    op.create_index("ix_products_category", "products", ["category"])
    op.create_index("ix_products_purchase_date", "products", ["purchase_date"])
    op.create_index("ix_products_warranty_end_date", "products", ["warranty_end_date"])

    # ------------------------------------------------------------- invoices
    op.create_table(
        "invoices",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_type", sa.String(length=120), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("storage_backend", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoices_product_id", "invoices", ["product_id"], unique=True)

    # ------------------------------------------------------ service_records
    op.create_table(
        "service_records",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=False),
        sa.Column("service_type", sa.String(length=120), nullable=True),
        sa.Column("provider", sa.String(length=160), nullable=True),
        sa.Column("cost", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("next_service_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_records_product_id", "service_records", ["product_id"])
    op.create_index("ix_service_records_service_date", "service_records", ["service_date"])

    # -------------------------------------------------------- notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "product_id",
            "type",
            "due_date",
            name="uq_notification_user_product_type_due",
        ),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_product_id", "notifications", ["product_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # --------------------------------------------- notification_preferences
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("reminder_90_days", sa.Boolean(), nullable=False),
        sa.Column("reminder_60_days", sa.Boolean(), nullable=False),
        sa.Column("reminder_30_days", sa.Boolean(), nullable=False),
        sa.Column("reminder_7_days", sa.Boolean(), nullable=False),
        sa.Column("reminder_1_day", sa.Boolean(), nullable=False),
        sa.Column("email_enabled", sa.Boolean(), nullable=False),
        sa.Column("push_enabled", sa.Boolean(), nullable=False),
        sa.Column("browser_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notification_preferences_user_id",
        "notification_preferences",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_preferences_user_id", table_name="notification_preferences")
    op.drop_table("notification_preferences")

    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_product_id", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_service_records_service_date", table_name="service_records")
    op.drop_index("ix_service_records_product_id", table_name="service_records")
    op.drop_table("service_records")

    op.drop_index("ix_invoices_product_id", table_name="invoices")
    op.drop_table("invoices")

    op.drop_index("ix_products_warranty_end_date", table_name="products")
    op.drop_index("ix_products_purchase_date", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_user_id", table_name="products")
    op.drop_table("products")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
