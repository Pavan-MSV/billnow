#!/usr/bin/env bash
# ==============================================================================
# BillNow — Oracle Cloud Always Free ARM64 Ubuntu VM Server Provisioning Script
# Target Architecture: Oracle Cloud Always Free (VM.Standard.A1.Flex, ARM64)
# OS: Ubuntu 22.04 LTS / 24.04 LTS
# Cost: ₹0 / month
# ==============================================================================

set -euo pipefail

echo "===================================================================="
echo ">>> Starting BillNow Server Provisioning..."
echo "===================================================================="

# 1. Update system packages
echo ">>> Updating apt package lists..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install core runtime dependencies
echo ">>> Installing Python 3.12, Nginx, Certbot, UFW, Fail2ban, and build tools..."
sudo apt-get install -y \
    software-properties-common \
    build-essential \
    curl \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

# Ensure Python 3.12 is installed (native on Ubuntu 24.04, deadsnakes PPA on 22.04)
if ! command -v python3.12 &> /dev/null; then
    echo ">>> Adding deadsnakes PPA for Python 3.12..."
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt-get update
    sudo apt-get install -y python3.12 python3.12-venv python3.12-dev
fi

# 3. Configure UFW Firewall
echo ">>> Configuring UFW Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH"
sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw --force enable

# 4. Configure Fail2ban for SSH protection
echo ">>> Enabling Fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 5. Create project directory
echo ">>> Creating /opt/billnow directory structure..."
sudo mkdir -p /opt/billnow
sudo chown -R ubuntu:ubuntu /opt/billnow

echo "===================================================================="
echo ">>> Server provisioning complete!"
echo ">>> Next step: Clone your repository into /opt/billnow and run deploy_backend.sh"
echo "===================================================================="
