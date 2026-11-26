# BILLNOW — PRODUCTION DEPLOYMENT MASTER GUIDE
**Tagline:** *"Never Forget a Warranty Again."*  
**Monthly Hosting Budget:** Strictly ₹0 / month (Free-Tier Services Only)  
**Architecture:**
- **Frontend:** React + Vite + TypeScript (Hosted on Cloudflare Pages)
- **Mobile Client:** Android Native APK via Capacitor
- **Backend:** FastAPI + Python 3.12 (Hosted on Oracle Cloud Always Free ARM64 VM)
- **Database:** Neon Serverless PostgreSQL
- **Invoice Vault:** Cloudflare R2 Private Bucket (S3-compatible, zero egress fees)
- **Push Alerts:** Firebase Cloud Messaging (FCM)
- **Email Delivery:** Brevo (300 emails/day free)
- **Uptime Monitoring:** UptimeRobot (Free 5-min heartbeat)

---

## SECTION 1: ORACLE CLOUD ALWAYS FREE VM (BACKEND)

### 1.1 Create the Instance
1. Log in to [Oracle Cloud Console](https://cloud.oracle.com/).
2. Navigate to **Compute** -> **Instances** -> **Create Instance**.
3. Choose the following settings to ensure it is **Always Free**:
   * **Image:** `Ubuntu 24.04 LTS (aarch64)` (or 22.04 LTS).
   * **Shape:** `Ampere (VM.Standard.A1.Flex)`
   * **OCPUs:** `1` (Free tier includes up to 4 OCPUs)
   * **Memory:** `6 GB` (Free tier includes up to 24 GB RAM)
   * **Networking:** Create new Virtual Cloud Network (VCN) with public subnet. Assign a public IPv4 address.
   * **SSH Keys:** Save the private key to your local machine (e.g., `~/.ssh/oracle_arm.key`).
4. Click **Create**.

### 1.2 Open Ingress Ports in Oracle Cloud Security List
1. In the Oracle Console, go to your instance's **Virtual Cloud Network** -> **Public Subnet** -> **Default Security List**.
2. Click **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80, 443`
   * **Description:** Allow HTTP and HTTPS web traffic.
3. Save the rule.

### 1.3 Provision the Server
Connect via SSH:
```bash
ssh -i ~/.ssh/oracle_arm.key ubuntu@<YOUR_ORACLE_VM_PUBLIC_IP>
```

Run the server setup script:
```bash
# Clone the repository
sudo git clone https://github.com/Pavan-MSV/billnow.git /opt/billnow
sudo chown -R ubuntu:ubuntu /opt/billnow

# Run automated server provisioning
cd /opt/billnow
chmod +x deploy/oracle/*.sh
./deploy/oracle/setup_server.sh
```

### 1.4 Configure Backend Environment (.env)
```bash
cd /opt/billnow/backend
cp .env.production.example .env
nano .env
```
Fill in your credentials (Neon, R2, Brevo, FCM) following the guides below, and generate a secure JWT secret:
```bash
openssl rand -hex 32
```

### 1.5 Enable Backend & Scheduler Systemd Services
```bash
# Install systemd service for Uvicorn
sudo cp /opt/billnow/deploy/oracle/billnow.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now billnow.service

# Install systemd daily scheduler timer (Runs daily warranty evaluations)
sudo cp /opt/billnow/deploy/oracle/billnow_scheduler.service /etc/systemd/system/
sudo cp /opt/billnow/deploy/oracle/billnow_scheduler.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now billnow_scheduler.timer

# Check service status
sudo systemctl status billnow.service
```

### 1.6 Configure Nginx & SSL Certificate
```bash
# Copy Nginx configuration
sudo cp /opt/billnow/deploy/oracle/nginx.conf /etc/nginx/sites-available/billnow
# Edit server_name to match your domain (e.g., api.yourdomain.com)
sudo nano /etc/nginx/sites-available/billnow

# Enable site
sudo ln -sf /etc/nginx/sites-available/billnow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Obtain free Let's Encrypt SSL Certificate
sudo certbot --nginx -d api.yourdomain.com

sudo systemctl restart nginx
```

---

## SECTION 2: NEON POSTGRESQL (DATABASE)

1. Database is already configured and migrated on Neon serverless PostgreSQL.
2. In `/opt/billnow/backend/.env`:
   ```dotenv
   DATABASE_URL=postgresql+psycopg2://neondb_owner:<PASSWORD>@ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
3. To run migrations in production:
   ```bash
   cd /opt/billnow/backend
   source .venv/bin/activate
   alembic upgrade head
   ```

---

## SECTION 3: CLOUDFLARE R2 PRIVATE STORAGE (INVOICES)

See complete instructions in [CLOUDFLARE_R2_SETUP.md](file:///d:/billnow/docs/CLOUDFLARE_R2_SETUP.md).
1. Create private bucket: `billnow-invoices` (Keep public access **Disabled**).
2. Generate S3 API tokens in R2 settings with `Object Read & Write`.
3. In `/opt/billnow/backend/.env`:
   ```dotenv
   STORAGE_BACKEND=s3
   STORAGE_BUCKET=billnow-invoices
   STORAGE_ACCESS_KEY=<YOUR_ACCESS_KEY>
   STORAGE_SECRET_KEY=<YOUR_SECRET_KEY>
   STORAGE_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   STORAGE_REGION=auto
   ```

---

## SECTION 4: BREVO EMAIL SETUP (TRANSACTIONAL)

See complete instructions in [BREVO_SETUP_GUIDE.md](file:///d:/billnow/docs/BREVO_SETUP_GUIDE.md).
1. Sign up at [Brevo.com](https://www.brevo.com/) (300 free emails/day).
2. Add and verify your sender email.
3. Obtain master SMTP key under **Transactional** -> **SMTP & API**.
4. In `/opt/billnow/backend/.env`:
   ```dotenv
   EMAIL_ENABLED=true
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<BREVO_LOGIN_EMAIL>
   SMTP_PASSWORD=<BREVO_SMTP_KEY>
   SMTP_FROM=BillNow <no-reply@yourdomain.com>
   SMTP_USE_TLS=true
   ```

---

## SECTION 5: FIREBASE PUSH NOTIFICATIONS (FCM)

See complete instructions in [FCM_PUSH_SETUP.md](file:///d:/billnow/docs/FCM_PUSH_SETUP.md).
1. Create free project on [Firebase Console](https://console.firebase.google.com/).
2. Under Project Settings -> Service accounts, click **Generate new private key**.
3. Save as `/opt/billnow/firebase-credentials.json` with permissions `600`.
4. In `/opt/billnow/backend/.env`:
   ```dotenv
   FCM_ENABLED=true
   FIREBASE_CREDENTIALS_PATH=/opt/billnow/firebase-credentials.json
   ```

---

## SECTION 6: CLOUDFLARE PAGES (FRONTEND)

See complete instructions in [CLOUDFLARE_PAGES_DEPLOYMENT.md](file:///d:/billnow/docs/CLOUDFLARE_PAGES_DEPLOYMENT.md).
1. Connect Cloudflare Pages to `https://github.com/Pavan-MSV/billnow`.
2. Settings:
   * **Root directory:** `frontend`
   * **Build command:** `npm run build`
   * **Output directory:** `dist`
3. Environment variables:
   * `VITE_API_URL` = `https://api.yourdomain.com`
4. Deploy. Cloudflare builds and serves your SPA worldwide.

---

## SECTION 7: ANDROID APK GENERATION (CAPACITOR)

1. On your local machine or build machine:
   ```bash
   cd frontend
   npm run build
   npx cap sync android
   ```
2. Place the `google-services.json` from your Firebase Android app into:
   ```text
   frontend/android/app/google-services.json
   ```
3. Open in Android Studio or compile via command line:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   Or in Windows PowerShell:
   ```powershell
   .\gradlew.bat assembleRelease
   ```
4. Output APK location:
   ```text
   frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
   ```

---

## SECTION 8: 24/7 FREE MONITORING (UPTIMEROBOT)

See complete instructions in [BACKUP_AND_MONITORING.md](file:///d:/billnow/docs/BACKUP_AND_MONITORING.md).
* Add HTTP Monitor pointing to: `https://api.yourdomain.com/api/health`
* Heartbeat interval: Every 5 minutes (₹0 cost forever).
* Verifies both VM uptime and live Neon PostgreSQL connectivity (`SELECT 1`).

---

## SECTION 9: OPERATIONAL RUNBOOK

### View Backend Logs:
```bash
sudo journalctl -u billnow.service -f
```

### View Daily Scheduler Logs:
```bash
sudo journalctl -u billnow_scheduler.service -n 50
```

### Trigger Manual Warranty Sweep:
```bash
cd /opt/billnow/backend
source .venv/bin/activate
python -m app.worker
```

### Zero-Downtime Application Update:
```bash
cd /opt/billnow
./deploy/oracle/deploy_backend.sh
```
