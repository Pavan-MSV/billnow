# BILLNOW — FIREBASE CLOUD MESSAGING (FCM) SETUP GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target:** Push Notifications for Android / Mobile Devices (₹0/month budget)

---

## 1. Why Firebase Cloud Messaging (FCM)?

Firebase Cloud Messaging (FCM) is completely **free** with unlimited push notifications. It powers native heads-up alerts on Android devices when:
* A warranty is expiring in 30 days, 7 days, or 1 day.
* A warranty has expired today.
* Scheduled preventive maintenance is due.

---

## 2. Setting Up Firebase Project (Zero Cost)

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
   * Project name: `billnow-app`
   * Google Analytics: Optional (can disable to simplify setup).
   * Click **Create project**.
3. In the project dashboard:
   * Click the **Android icon** (`</>`) to add an Android app.
   * Package name: `com.billnow.app`
   * App nickname: `BillNow`
   * Click **Register app**.
   * Download `google-services.json` (save this for the Android Capacitor project in Phase 8).

---

## 3. Generating the Service Account Key for Backend

1. In the Firebase Console, click the **Gear icon (Project settings)** next to Project Overview.
2. Go to the **Service accounts** tab.
3. Select **Firebase Admin SDK** (Python).
4. Click **Generate new private key**, then click **Generate key**.
5. A JSON file will download (e.g., `billnow-app-firebase-adminsdk-xxxxx.json`).
6. Securely upload this file to your backend server (e.g. `/opt/billnow/firebase-credentials.json`).
7. Ensure strict file permissions on the server:
   ```bash
   chmod 600 /opt/billnow/firebase-credentials.json
   chown ubuntu:ubuntu /opt/billnow/firebase-credentials.json
   ```

---

## 4. Backend Configuration

Add the following to your backend `.env` file:

```dotenv
# FCM / Push notifications
FCM_ENABLED=true
FIREBASE_CREDENTIALS_PATH=/opt/billnow/firebase-credentials.json
```

---

## 5. Daily Automated Sweep Service

The background worker (`backend/app/worker.py`) is automated using a systemd timer on Ubuntu:

```bash
# Copy systemd units
sudo cp deploy/oracle/billnow_scheduler.service /etc/systemd/system/
sudo cp deploy/oracle/billnow_scheduler.timer /etc/systemd/system/

# Reload systemd and enable timer
sudo systemctl daemon-reload
sudo systemctl enable --now billnow_scheduler.timer

# Check timer status
systemctl list-timers billnow_scheduler.timer
```

Every night at **00:00:00**, the service runs:
1. Evaluates all active warranties in Neon PostgreSQL.
2. Generates missing milestone reminder records.
3. Retrieves active FCM device tokens for users who have enabled push notifications.
4. Dispatches high-priority push messages to Android devices.
