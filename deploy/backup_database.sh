#!/usr/bin/env bash
# ==============================================================================
# BillNow — Automated Database Backup Script
# Creates a compressed PostgreSQL snapshot and uploads it to Cloudflare R2
# Schedule via systemd timer or cron: 0 2 * * * (Every night at 02:00 AM)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/billnow/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/billnow_backup_${TIMESTAMP}.dump"
DAYS_TO_KEEP=7

# Load environment variables
if [ -f /opt/billnow/backend/.env ]; then
    export $(grep -v '^#' /opt/billnow/backend/.env | xargs)
fi

mkdir -p "${BACKUP_DIR}"

echo ">>> Starting PostgreSQL database dump at $(date)..."

# Run pg_dump
pg_dump "${DATABASE_URL}" \
    --format=custom \
    --no-owner \
    --no-privileges \
    -f "${BACKUP_FILE}"

echo ">>> Backup created successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# If AWS CLI or R2 storage credentials are configured, sync to Cloudflare R2 backup prefix
if [ -n "${STORAGE_ACCESS_KEY:-}" ] && [ -n "${STORAGE_SECRET_KEY:-}" ] && [ -n "${STORAGE_ENDPOINT_URL:-}" ]; then
    echo ">>> Uploading backup to Cloudflare R2 backup vault..."
    export AWS_ACCESS_KEY_ID="${STORAGE_ACCESS_KEY}"
    export AWS_SECRET_ACCESS_KEY="${STORAGE_SECRET_KEY}"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_FILE}" "s3://${STORAGE_BUCKET}/backups/$(basename "${BACKUP_FILE}")" \
            --endpoint-url "${STORAGE_ENDPOINT_URL}"
        echo ">>> Upload to Cloudflare R2 complete."
    fi
fi

# Cleanup old local dumps
echo ">>> Pruning local backups older than ${DAYS_TO_KEEP} days..."
find "${BACKUP_DIR}" -type f -name "billnow_backup_*.dump" -mtime +"${DAYS_TO_KEEP}" -delete

echo ">>> Backup routine finished successfully."
