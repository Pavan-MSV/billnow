# BILLNOW — BACKUPS & UPTIME MONITORING GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target:** 24/7 Availability & Disaster Recovery  
**Budget:** Strictly ₹0 / month (UptimeRobot Free Tier + Cloudflare R2 Backups)

---

## 1. Automated Database Backups

### 1.1 Scheduled Backup Script
The backup script at `deploy/backup_database.sh`:
* Executes `pg_dump` on Neon PostgreSQL.
* Generates a custom-format compressed binary dump.
* Uploads the dump to `s3://billnow-invoices/backups/` in your private Cloudflare R2 bucket.
* Prunes local backups older than 7 days to preserve VM disk space.

### 1.2 Automation via Crontab or Systemd Timer
To run the backup automatically every night at 02:00 AM:
```bash
sudo crontab -e
# Add the following line:
0 2 * * * /opt/billnow/deploy/backup_database.sh >> /var/log/billnow_backup.log 2>&1
```

---

## 2. Zero-Cost 24/7 Uptime Monitoring (UptimeRobot)

UptimeRobot offers **50 free monitors** checked every 5 minutes at ₹0 cost forever.

### Step 2.1: Create an UptimeRobot Account
1. Sign up free at [UptimeRobot.com](https://uptimerobot.com/).
2. Verify your email address.

### Step 2.2: Add Backend API Health Monitor
1. In the UptimeRobot dashboard, click **Add New Monitor**.
2. Configure:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `BillNow Backend & DB Health`
   * **URL (or IP):** `https://api.yourdomain.com/api/health`
   * **Monitoring Interval:** `Every 5 minutes`
   * **Monitor Timeout:** `30 seconds`
3. Click **Advanced Settings**:
   * **Custom HTTP Headers:** `Accept: application/json`
   * **Keyword Monitoring (Optional):** Alert if `"status":"ok"` is missing.
4. Select your email or mobile notification channels.
5. Click **Create Monitor**.

### Step 2.3: Add Frontend Monitor
1. Click **Add New Monitor**.
2. Configure:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `BillNow Frontend Web`
   * **URL:** `https://billnow.pages.dev` (or your custom domain)
   * **Monitoring Interval:** `Every 5 minutes`
3. Click **Create Monitor**.

---

## 3. Disaster Recovery & Restoration Procedure

If you ever need to restore your database from a backup file:

```bash
# 1. Download the latest backup from Cloudflare R2 (or take local file)
aws s3 cp s3://billnow-invoices/backups/billnow_backup_YYYYMMDD_HHMMSS.dump /tmp/restore.dump \
    --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# 2. Restore to Neon PostgreSQL
pg_restore -d "${DATABASE_URL}" \
           --clean \
           --if-exists \
           --no-owner \
           --no-privileges \
           /tmp/restore.dump

echo "Database restoration completed."
```
