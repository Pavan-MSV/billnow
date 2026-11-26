# BILLNOW — BREVO TRANSACTIONAL EMAIL SETUP GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target:** Transactional Email (OTP, Password Resets, Account Deletion)  
**Budget:** Strictly ₹0/month (Brevo Forever Free Tier: 300 emails/day)

---

## 1. Why Brevo (formerly Sendinblue)?

Brevo offers the most generous free transactional email tier available:
* **300 free emails per day** (up to ~9,000 emails/month).
* Zero monthly subscription or credit card required.
* Standard SMTP relay support (`smtp-relay.brevo.com`).
* Reliable inbox deliverability with DKIM/SPF support.

---

## 2. Step-by-Step Account & SMTP Setup

### Step 2.1: Create a Free Account
1. Visit [Brevo.com](https://www.brevo.com/) and click **Sign up free**.
2. Complete account registration and email verification.

### Step 2.2: Add and Verify Your Sender
1. In the Brevo dashboard, click your profile name (top right) -> **Senders, Domains & Dedicated IPs**.
2. Click **Senders** -> **Add a sender**.
3. Enter:
   * **From Name:** `BillNow Notifications`
   * **From Email:** `no-reply@yourdomain.com` (or your verified Gmail / domain).
4. Verify the email via the verification code sent to your inbox.

### Step 2.3: Generate SMTP Key
1. Go to **Transactional** in the main navigation (or top-right menu -> **SMTP & API**).
2. Click the **SMTP** tab.
3. Note your credentials:
   * **SMTP Server:** `smtp-relay.brevo.com`
   * **Port:** `587`
   * **Login / User:** Your Brevo account email address
4. Click **Generate a new SMTP key**.
5. Copy the master SMTP key (password).

---

## 3. Backend Configuration

Add the credentials to your production `.env` file on the backend server:

```dotenv
# Transactional Email (Brevo Free Tier)
EMAIL_ENABLED=true
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<YOUR_BREVO_LOGIN_EMAIL>
SMTP_PASSWORD=<YOUR_BREVO_SMTP_KEY>
SMTP_FROM=BillNow <no-reply@yourdomain.com>
SMTP_USE_TLS=true
```

---

## 4. Built-in Safeguards in BillNow

* **300 Emails/Day Quota Guard:**  
  `backend/app/services/email.py` includes an internal daily counter. If 300 emails are dispatched in a single calendar day, further emails are logged and safely suppressed to prevent account overages or delivery penalties.
* **Responsive HTML Templates:**  
  OTP codes, password reset buttons, and account deletion confirmation links automatically render in clean, branded HTML for desktop and mobile mail clients.
