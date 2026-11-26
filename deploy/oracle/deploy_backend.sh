#!/usr/bin/env bash
# ==============================================================================
# BillNow — Automated Zero-Downtime Backend Deployment Script
# Execute this on the Oracle Cloud VM to pull updates and restart services
# Usage: ./deploy_backend.sh
# ==============================================================================

set -euo pipefail

APP_DIR="/opt/billnow"
BACKEND_DIR="${APP_DIR}/backend"

echo "===================================================================="
echo ">>> Starting BillNow Backend Deployment..."
echo "===================================================================="

cd "${APP_DIR}"

# 1. Fetch latest git updates
echo ">>> Pulling latest commits from GitHub..."
git fetch origin main
git reset --hard origin/main

# 2. Activate Python virtual environment
cd "${BACKEND_DIR}"
if [ ! -d ".venv" ]; then
    echo ">>> Creating Python 3.12 virtual environment..."
    python3.12 -m venv .venv
fi

echo ">>> Activating virtual environment & installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Apply database migrations
echo ">>> Running Alembic database migrations..."
alembic upgrade head

# 4. Restart backend service
echo ">>> Restarting billnow.service..."
sudo systemctl restart billnow.service

# 5. Verify health check
echo ">>> Waiting 3 seconds for service startup..."
sleep 3

echo ">>> Verifying health endpoint..."
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/api/health || echo "FAILED")

if echo "${HEALTH_RESPONSE}" | grep -q '"status":"ok"'; then
    echo ">>> Deployment successful! Health status: ${HEALTH_RESPONSE}"
else
    echo ">>> WARNING: Health check failed or returned unexpected response:"
    echo "${HEALTH_RESPONSE}"
    echo ">>> Check logs with: sudo journalctl -u billnow.service -n 50"
    exit 1
fi

echo "===================================================================="
echo ">>> BillNow Backend is Live & Healthy!"
echo "===================================================================="
