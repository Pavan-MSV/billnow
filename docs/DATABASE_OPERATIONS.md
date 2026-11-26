# BILLNOW — NEON POSTGRESQL & DATABASE OPERATIONS GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target Database:** Neon Serverless PostgreSQL (Free Tier)

---

## 1. Connection Architecture

### 1.1 Connection Strings & Endpoints
Neon provides two distinct host endpoints:
1. **Pooled Connection (Default for Web & API Services):**  
   `ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech/neondb`
   * Powered by PgBouncer.
   * Efficiently handles spikes in concurrent connections.
   * Required parameters: `sslmode=require&channel_binding=require`.
2. **Direct Compute Connection (Required for Alembic Migrations):**  
   `ep-calm-thunder-bdf3mlwp.c-8.us-east-2.aws.neon.tech/neondb`
   * Direct connection to the Postgres compute node without PgBouncer transaction pooling.
   * Recommended when running complex DDL migrations that require session-level locking.

### 1.2 URL Format
FastAPI and SQLAlchemy use `psycopg2-binary`:
```bash
postgresql+psycopg2://neondb_owner:<PASSWORD>@ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 2. Production Connection Pooling Settings

In `backend/app/db/session.py`, the engine is configured with production-tuned parameters:

| Parameter | Value | Purpose |
| :--- | :--- | :--- |
| `pool_pre_ping` | `True` | Tests the connection with a lightweight ping before leasing it to a request, seamlessly handling Neon auto-suspend/wake-up cycles without 500 errors. |
| `pool_size` | `10` | Maintains 10 persistent connections per worker process within free-tier limits. |
| `max_overflow` | `20` | Allows up to 20 additional burst connections under high traffic spikes. |
| `pool_timeout` | `30` | Seconds to wait before timing out if all connections are saturated. |
| `pool_recycle` | `1800` | Recycles connections after 30 minutes to prevent stale socket dropouts across cloud firewalls. |

---

## 3. Database Migration Procedures (Alembic)

### 3.1 Applying Migrations
To upgrade the database to the latest schema version:
```bash
cd backend
# Activate virtual environment
# Windows: .\.venv\Scripts\Activate.ps1
# Linux: source .venv/bin/activate

alembic upgrade head
```

### 3.2 Checking Current Migration Status
```bash
alembic current
alembic history --verbose
```

### 3.3 Creating a New Migration
When modifying SQLAlchemy models in `backend/app/models/`:
```bash
# Auto-generate migration script by comparing models to DB
alembic revision --autogenerate -m "describe_change"

# Always review the generated script in alembic/versions/ before applying!
alembic upgrade head
```

### 3.4 Rolling Back Migrations
If a migration fails or must be rolled back:
```bash
# Step back 1 migration
alembic downgrade -1

# Rollback to a specific revision ID
alembic downgrade <revision_id>
```

---

## 4. Automated Backup & Recovery Procedures

### 4.1 Neon Built-in Point-In-Time Recovery (PITR)
Neon Free Tier automatically provides continuous branch history and Point-In-Time Recovery:
1. Open the [Neon Console](https://console.neon.tech/).
2. Select the **billnow** project.
3. Under **Branches**, you can create a restore branch from any exact minute in the past 24 hours.

### 4.2 Manual / Scheduled Logical Backups (`pg_dump`)
Run a logical snapshot backup:
```bash
# Set pg password in environment to avoid prompt
export PGPASSWORD="<NEON_PASSWORD>"

# Execute compressed dump
pg_dump -h ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech \
        -U neondb_owner \
        -d neondb \
        --format=custom \
        --no-owner \
        --no-privileges \
        -f "billnow_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 4.3 Restoring from a Backup
To restore data into a clean database:
```bash
export PGPASSWORD="<NEON_PASSWORD>"

pg_restore -h ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech \
           -U neondb_owner \
           -d neondb \
           --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           "billnow_backup_20261126_200000.dump"
```

---

## 5. Safe Transaction Guidelines

1. **Transactional DDL:** PostgreSQL supports transactional DDL. If an Alembic migration fails midway, all changes are automatically rolled back.
2. **Non-Destructive Migrations:** Never drop columns or tables without prior deprecation phases. Add new columns as `nullable=True` first, populate them, and then enforce constraints.
3. **Cascading Deletes:** Foreign keys (`products.user_id`, `invoices.product_id`, `service_records.product_id`, `notifications.user_id`) use `ON DELETE CASCADE` so deleting a user or product automatically cleans up orphan child rows safely.
