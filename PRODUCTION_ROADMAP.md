# BILLNOW — PRODUCTION ROADMAP & EXECUTION PLAN
**Project Tagline:** *"Never Forget a Warranty Again."*  
**Architecture:** React/Vite + Capacitor + FastAPI + Neon Postgres + Cloudflare R2 + Oracle Cloud VM + Brevo + FCM  
**Budget Constraint:** Strictly ₹0/month (Free-tier services only)  
**Approval Gate:** User review and confirmation required before starting implementation.

---

## Roadmap Overview

```
Phase 1: Project Audit & Gap Analysis [COMPLETE]
   │
   ▼
Phase 2: Backend Production Hardening
   │
   ▼
Phase 3: Neon PostgreSQL Optimization & Migration
   │
   ▼
Phase 4: Cloudflare R2 Private Storage & Presigned URLs
   │
   ▼
Phase 5: Warranty Background Scheduler & Firebase FCM
   │
   ▼
Phase 6: Brevo Email Integration (Free Tier)
   │
   ▼
Phase 7: Account Management, Public Deletion & CSV Export
   │
   ▼
Phase 8: Frontend Polish, Mobile UX & Standalone Legal Pages
   │
   ▼
Phase 9: Oracle Cloud Always Free ARM64 Deployment Automation
   │
   ▼
Phase 10: Cloudflare Pages Frontend Deployment
   │
   ▼
Phase 11: Production Environment Configuration & Secrets Management
   │
   ▼
Phase 12: Automated Backups, Monitoring & Health Verification
   │
   ▼
Phase 13: Automated Security & Regression Testing Suite
   │
   ▼
Phase 14: Operational Runbooks & Deployment Sign-off
```

---

## Detailed Phase Breakdown

### Phase 2: Backend Production Hardening
- **Objective:** Secure, validate, and harden all backend endpoints.
- **Tasks:**
  1. Verify password hashing standards (bcrypt cost 12 with Argon2id compatibility).
  2. Implement OTP brute-force limits: maximum 3 failed attempts per OTP before invalidation.
  3. Memory cleanup daemon for expired OTP entries in `_otp_cache`.
  4. Enhance health-check endpoint (`GET /api/health`) to execute a lightweight `SELECT 1` query to verify database health.
  5. Harden CORS settings with strict origin verification.
  6. Verify ownership authorization across every user endpoint (zero horizontal privilege escalation).
  7. Run full test suite and verify no regressions.
- **Deliverables:** Updated `backend/app/main.py`, `backend/app/api/routes/auth.py`, `backend/app/core/security.py`.
- **Acceptance Criteria:** All existing 63 tests pass + new health-check and OTP rate-limit tests pass.

---

### Phase 3: Neon PostgreSQL Optimization & Migration
- **Objective:** Configure robust connection pooling and safe migration practices for Neon Serverless PostgreSQL.
- **Tasks:**
  1. Optimize SQLAlchemy engine settings: `pool_size=10`, `max_overflow=20`, `pool_recycle=1800`, `pool_pre_ping=True`.
  2. Verify connection string parser handles Neon pooler URLs (`channel_binding=require&sslmode=require`).
  3. Validate database indexes on foreign keys (`user_id`, `product_id`) and query filters (`warranty_end_date`, `is_read`, `service_date`).
  4. Write migration guide and automated rollback test procedures.
- **Deliverables:** Updated `backend/app/db/session.py`, `docs/DATABASE_OPERATIONS.md`.
- **Acceptance Criteria:** Seamless connection recovery across Neon compute sleep/wake cycles.

---

### Phase 4: Cloudflare R2 Private Storage & Presigned URLs
- **Objective:** Implement zero-cost, private invoice file storage with pre-signed download URLs.
- **Tasks:**
  1. Upgrade `backend/app/services/storage/s3.py` to support `generate_presigned_url('get_object', ...)` with 15-minute expiration.
  2. Implement magic byte verification in `backend/app/services/uploads.py` (validate header signatures for PDF, JPEG, PNG).
  3. Add presigned download endpoint: `GET /api/products/{id}/invoice/presigned-url` for direct browser streaming.
  4. Enforce strict ownership authorization before issuing presigned URLs.
  5. Ensure invoice files are automatically purged from R2 when products or accounts are deleted.
- **Deliverables:** Updated `s3.py`, `uploads.py`, `invoices.py`, and new unit tests.
- **Acceptance Criteria:** Test invoice upload, presigned link generation, and direct download without routing file bytes through FastAPI.

---

### Phase 5: Warranty Background Scheduler & Firebase FCM
- **Objective:** Automate daily warranty checks and enable push notifications for mobile devices.
- **Tasks:**
  1. Create `DeviceToken` SQLAlchemy model for storing FCM device registration tokens.
  2. Create Alembic migration `0003_add_device_tokens.py`.
  3. Add endpoints `POST /api/notifications/fcm-token` and `DELETE /api/notifications/fcm-token`.
  4. Implement `backend/app/services/fcm.py` using Firebase Admin SDK (with graceful fallback if unconfigured).
  5. Implement standalone background worker script `backend/app/worker.py` to run daily warranty evaluations and dispatch both in-app and FCM push notifications.
  6. Create systemd timer service `billnow_scheduler.timer` for production execution.
- **Deliverables:** `fcm.py`, `worker.py`, device token endpoints, and Alembic migration.
- **Acceptance Criteria:** Triggering `worker.py` creates milestone alerts (90, 60, 30, 7, 1 day) and sends push messages to registered device tokens.

---

### Phase 6: Brevo Email Integration (Free Tier)
- **Objective:** Configure production transactional email delivery within Brevo's 300 free emails/day tier.
- **Tasks:**
  1. Configure `backend/app/services/email.py` to support both Brevo SMTP relay (`smtp-relay.brevo.com:587`) and Brevo REST API v3.
  2. Implement responsive HTML email templates for OTP verification, password reset, and warranty alert digests.
  3. Add daily email rate tracking to ensure the app never exceeds the 300 emails/day free tier.
  4. Create DNS verification guide (SPF, DKIM, DMARC) for user domain.
- **Deliverables:** Updated `email.py`, email templates, `docs/BREVO_SETUP_GUIDE.md`.
- **Acceptance Criteria:** Successful delivery of OTP and reset emails via Brevo relay.

---

### Phase 7: Account Management, Public Deletion & CSV Export
- **Objective:** Fulfill Google Play Store requirements and enhance data portability.
- **Tasks:**
  1. Add password verification requirement to authenticated `DELETE /api/settings/account`.
  2. Create public endpoint `POST /api/auth/request-account-deletion` and token verification endpoint `POST /api/auth/confirm-account-deletion`.
  3. Create public frontend page `/delete-account` with email token confirmation.
  4. Implement CSV data export endpoint `GET /api/settings/export?format=csv`.
  5. Ensure all user files, invoices, service records, and device tokens are completely scrubbed upon deletion.
- **Deliverables:** Updated `settings.py` routes, new frontend `DeleteAccountPage.tsx`, updated export service.
- **Acceptance Criteria:** Full account deletion verified via public link and via mobile settings with password.

---

### Phase 8: Frontend Polish, Mobile UX & Standalone Legal Pages
- **Objective:** Finalize mobile-first UI, add standalone legal pages, and prepare Capacitor bridge.
- **Tasks:**
  1. Create standalone public pages `frontend/src/pages/PrivacyPolicyPage.tsx` (`/privacy`) and `frontend/src/pages/TermsPage.tsx` (`/terms`).
  2. Add privacy and terms links to PublicNavbar, Footer, LoginPage, and RegisterPage.
  3. Install Capacitor: `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
  4. Generate `capacitor.config.ts` (`com.billnow.app`).
  5. Add offline banner indicator when internet connection is lost.
  6. Add smooth skeleton loading states for product and dashboard views.
- **Deliverables:** Legal pages, updated router in `App.tsx`, `capacitor.config.ts`.
- **Acceptance Criteria:** `npm run build` succeeds, standalone legal pages render cleanly on mobile viewports.

---

### Phase 9: Oracle Cloud Always Free ARM64 VM Deployment Automation
- **Objective:** Complete automated provisioning and deployment scripts for Oracle Cloud Ubuntu ARM64 VM.
- **Tasks:**
  1. Create `deploy/oracle/setup_server.sh` to install Python 3.12, Uvicorn, Nginx, Certbot, UFW, and Fail2ban on Ubuntu 22.04/24.04 ARM64.
  2. Create `deploy/oracle/nginx.conf` with TLS 1.3, reverse proxy to Uvicorn, rate limiting, and HTTP security headers.
  3. Create `deploy/oracle/billnow.service` systemd unit file with automatic restart on failure.
  4. Create `deploy/oracle/billnow_scheduler.service` and `billnow_scheduler.timer` for automated daily warranty scans.
  5. Create zero-downtime deployment script `deploy/oracle/deploy_backend.sh`.
- **Deliverables:** Complete deployment automation suite in `deploy/oracle/`.
- **Acceptance Criteria:** Scripts tested and documented with step-by-step Oracle Cloud setup guide.

---

### Phase 10: Cloudflare Pages Frontend Deployment
- **Objective:** Deploy the React frontend to Cloudflare Pages (Free Tier) with global edge distribution.
- **Tasks:**
  1. Configure `frontend/public/_redirects` to handle single-page application client routing (`/*  /index.html  200`).
  2. Create Cloudflare Pages build configuration documentation.
  3. Configure environment variable injection (`VITE_API_URL` pointing to backend API domain).
  4. Verify production build optimization and asset compression.
- **Deliverables:** `_redirects`, `docs/CLOUDFLARE_PAGES_DEPLOYMENT.md`.
- **Acceptance Criteria:** Clean static build ready for direct Git integration with Cloudflare Pages.

---

### Phase 11: Production Environment Configuration & Zero-Trust Secrets
- **Objective:** Standardize and secure all production configuration variables.
- **Tasks:**
  1. Create comprehensive, documented `.env.production.example` for backend.
  2. Create `.env.production.example` for frontend.
  3. Verify that zero secrets, passwords, or tokens are committed to Git.
  4. Provide step-by-step guide for generating secure secrets (`openssl rand -hex 32`).
- **Deliverables:** Production environment templates and secrets documentation.
- **Acceptance Criteria:** Clear separation of development and production configurations.

---

### Phase 12: Automated Backups, Monitoring & Health Verification
- **Objective:** Implement automated database backups and zero-cost uptime monitoring.
- **Tasks:**
  1. Write `deploy/backup_database.sh` to execute `pg_dump` of Neon DB and upload encrypted backup to Cloudflare R2 bucket.
  2. Create automated backup systemd timer for weekly backup execution.
  3. Document free monitoring setup via UptimeRobot (probing `https://api.yourdomain.com/api/health` every 5 minutes).
  4. Write database restore verification procedure.
- **Deliverables:** `backup_database.sh`, `docs/BACKUP_AND_MONITORING.md`.
- **Acceptance Criteria:** End-to-end backup and restore test verified without data loss.

---

### Phase 13: Automated Security & Regression Testing Suite
- **Objective:** Verify security postures and full feature compatibility across the entire stack.
- **Tasks:**
  1. Implement automated test cases for presigned URLs, file magic bytes, and upload limits.
  2. Implement tests for device token registration and public account deletion flow.
  3. Implement automated test for CSV data export format.
  4. Run OWASP ZAP / Bandit static analysis check on Python backend.
  5. Run TypeScript strict type-check (`tsc --noEmit`).
- **Deliverables:** New tests in `backend/tests/`, security test report.
- **Acceptance Criteria:** 100% test pass rate across all new and existing test suites.

---

### Phase 14: Operational Runbooks & Deployment Sign-off
- **Objective:** Final documentation, operational runbooks, and ready-to-run deployment guides for user execution.
- **Tasks:**
  1. Create `PRODUCTION_DEPLOYMENT_GUIDE.md` with step-by-step instructions for:
     - Oracle Cloud VM creation (`VM.Standard.A1.Flex`, ₹0).
     - Cloudflare Pages setup (₹0).
     - Cloudflare R2 bucket setup (₹0).
     - Brevo SMTP setup (₹0).
     - Firebase project and FCM setup (₹0).
     - Android APK generation via Capacitor (₹0).
  2. Conduct final pre-deployment review.
  3. Request user approval before any production execution.
- **Deliverables:** `PRODUCTION_DEPLOYMENT_GUIDE.md`, `README.md` final update.
- **Acceptance Criteria:** Complete, turnkey operational documentation ready for user sign-off.
