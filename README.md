# BillNow — Smart Warranty & Invoice Vault 📱🛡️

> **“Never Forget a Warranty Again.”**

BillNow is a **mobile-first, app-style web application** built to track product purchases, organize invoices, monitor warranty expirations, and record service histories. The entire user experience is crafted to look and feel like a native Android/iOS mobile application with touch-friendly controls, bottom navigation, mobile OTP verification, and clean phone dimensions (`max-w-[440px]`).

---

## 📑 Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Pin-to-Pin Feature Breakdown](#2-pin-to-pin-feature-breakdown)
- [3. Architecture & Tech Stack](#3-architecture--tech-stack)
- [4. Database Schema](#4-database-schema)
- [5. Prerequisites](#5-prerequisites)
- [6. Complete Step-by-Step Run Commands](#6-complete-step-by-step-run-commands)
  - [Step 1: Database Setup & Startup](#step-1-database-setup--startup)
  - [Step 2: Backend Setup & Startup](#step-2-backend-setup--startup)
  - [Step 3: Frontend Setup & Startup](#step-3-frontend-setup--startup)
- [7. Mobile & Email OTP Verification System](#7-mobile--email-otp-verification-system)
- [8. Testing & Validation Commands](#8-testing--validation-commands)
- [9. Directory Structure](#9-directory-structure)
- [10. REST API Reference](#10-rest-api-reference)
- [11. 100% Free Cloud Deployment Guide (Vercel + Render + Neon)](#11-100-free-cloud-deployment-guide)
- [12. Mobile Application Conversion Guide (Android APK & iOS)](#12-mobile-application-conversion-guide)

---

## 1. System Overview

- **Mobile Viewport Target:** Designed primarily for modern mobile screens (360×800, 375×812, 390×844, 412×915).
- **Desktop Adaptation:** Centered in clean phone dimensions (`max-w-[440px]`, full viewport height `min-h-dvh`), with no fake hardware bezels or mock status bars.
- **Data Persistence:** Relational PostgreSQL database via SQLAlchemy ORM & Alembic migrations (cloud-hosted on Neon.tech with local fallback).
- **Authentication & Verification:** Secure JWT access/refresh token architecture with 2-step mobile and email OTP verification.
- **PWA-Ready:** Progressive Web App manifest (`manifest.webmanifest`) and service worker (`sw.js`) supporting installability and offline caching.

---

## 2. Pin-to-Pin Feature Breakdown

### 🌟 Opening & Splash Screen
- **Branded Animated Splash:** Displays the BillNow logo mark, app name, and tagline *“Never Forget a Warranty Again.”*
- **Animation Sequence:** Logo zooms smoothly from 90% → 100%, verified shield badge pops, brand typography fades in, and progress bar animates.
- **Smart Navigation:** Auto-transitions after 2.5s directly to `/dashboard` (if already logged in) or `/login` (if unauthenticated).
- **Skip Action:** One-tap "Skip" button for immediate entry.

### 🔐 Authentication & Dual OTP Verification
- **JWT Architecture:** Secure HTTP access and refresh tokens with password hashing via bcrypt.
- **User Isolation:** Users strictly access only their own products, invoices, service records, and alerts.
- **2-Step Registration Flow:**
  - *Step 1:* User enters Full Name, Email, Mobile Number, and Password.
  - *Step 2:* 6-digit verification code is dispatched to both Email and Mobile.
  - User enters the OTP code, verifies their identity, and their account is created with their verified mobile number stored permanently.
- **Dynamic Mobile Number Storage:** The registered user's phone number is saved to the database and displayed accurately in their Account profile (no hardcoded fallback numbers).

### 🏠 Home / Dashboard (`/dashboard`)
- **Header:** Personalized greeting (`Hello, {User} 👋`), small BillNow logo mark, notification bell with unread badge, and profile avatar.
- **Warranty Summary Grid:** 4 compact cards:
  - **Total Products**
  - **Active Warranties**
  - **Expiring Soon**
  - **Expired**
- **Warranty Alerts Section:** High-priority cards:
  - ⚠️ *Expiring Soon:* Highlights items with approaching warranty expiration with direct "View" actions.
  - ✓ *Active Highlights:* Cards showing remaining warranty periods with visual indicators.
- **My Products Feed:** Compact, touch-friendly product cards displaying category icon, brand, model, purchase date, status badge, and days left.
- **Floating Action Button (FAB):** Fixed `+ Add Product` button for quick access.

### 📦 Product Management & Details (`/products`, `/products/:id`)
- **13 Recognized Categories with Custom Icons:**
  - 📱 Mobile, 💻 Laptop, 📺 Television, ❄️ Refrigerator, 🌀 Washing Machine, 💨 Air Conditioner, 🍲 Microwave, 🛋️ Furniture, 🍳 Kitchen Appliances, 🏠 Home Appliances, ⚡ Electronics, 🚗 Vehicle, 📦 Other.
- **Add Product Form (`/products/add`):**
  - Product Information: Name, Category picker grid, Brand, Model number, Serial number.
  - Purchase Information: Purchase date picker, Price in ₹ (INR), Seller / Store name, Store location.
  - Warranty Information: Duration period, Start date, Expiry date, and Quick Preset buttons (`6M`, `12M`, `24M`, `36M`, `60M`).
  - Invoice Attachment: File picker supporting PDF, JPG, JPEG, and PNG (stored securely in private storage without OCR).
- **Product Details Page (`/products/:id`):**
  - Visual Warranty Progress Bar: Dynamically calculates percentage of warranty elapsed with color transitions (Emerald → Amber → Rose).
  - Purchase details & warranty timeline overview.
  - Invoice section: File type badge, download invoice, delete invoice, upload replacement.
  - Service history section: Log past maintenance and repairs with cost and notes.
- **Products Catalog Filter & Search (`/products`):**
  - Instant search across product names, brands, models, and serial numbers.
  - Horizontal category icon scroller.
  - Status filter chips: All, Active, Expiring Soon, Expired.
  - Sort by purchase date, expiration date, name, or price.

### 🔔 Warranty & Service Alerts (`/notifications`)
- Dedicated notification center with filter tabs: *All*, *Expiring Soon*, *Expired*, and *Service Reminders*.
- Interactive notification cards with contextual badges and one-tap "View Product" links.
- "Mark All as Read" action and dynamic unread badge count on the bottom navigation.

### 👤 Account & Settings (`/settings`)
- User Profile Card with avatar, name, email, and live registered mobile number.
- **My BillNow Statistics Grid:** Quick counts for products, invoices, active warranties, and expired items.
- **Personal Information Modal:** Update full name, email, and mobile number.
- **Change Password Modal:** Secure current and new password validation.
- **Appearance:** 1-tap Dark Mode / Light Mode toggle with smooth theme transition and local storage persistence.
- **Notification Settings Modal:** Toggle warranty expiry reminders, service alerts, and adjust notification threshold days.
- **Data Export:** Download a complete JSON archive of all personal data, products, and service logs.
- **Account Actions:** Delete account confirmation modal and Logout.
- **Support Modals:** Help Center, Privacy Policy, and Terms of Service.

### 🧭 Navigation & Layout
- **Fixed Mobile Bottom Navigation:** 4 primary destinations (`Home`, `Products`, `Alerts`, `Account`).
- **Context-Aware Visibility:** Bottom navigation automatically hides on full-screen forms (Add Product, Edit Product) for maximum focus.
- **Strict Mobile Dimensions:** Borderless, clean 440px max width centered on larger screens.

---

## 3. Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    BillNow Architecture                     │
├──────────────────────────────┬──────────────────────────────┤
│ Frontend (React + Vite + TS) │ Backend (FastAPI + Python)   │
│ - Mobile-First PWA           │ - RESTful API v1             │
│ - Tailwind CSS Styling       │ - SQLAlchemy 2.0 ORM         │
│ - Lucide Icons               │ - Alembic Migrations         │
│ - Context-Based State        │ - JWT Auth & Password Hashing│
│ - 2-Step OTP UI              │ - Email & Mobile OTP Service │
├──────────────────────────────┴──────────────────────────────┤
│                         Storage                             │
│ - Neon Serverless PostgreSQL 16 (Relational DB)             │
│ - Local Secure Filesystem Storage (Invoices)                │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5.6, Vite 6, Tailwind CSS 3.4, Lucide React, Axios, React Router DOM 6 |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PyJWT, Passlib (bcrypt) |
| **Database** | PostgreSQL 16 (Cloud Neon Serverless or Local Embedded `.pgsql`) |
| **Mobile App Shell** | Capacitor (Android APK & iOS IPA) / PWA / TWA |
| **Invoice Storage** | Secure local filesystem (`backend/storage`) with MIME & size validation |

---

## 4. Database Schema

The database consists of 6 primary relational tables with full Alembic migration history (`0001_initial_schema.py` and `0002_add_phone.py`):

```mermaid
erDiagram
    users ||--o{ products : owns
    users ||--o{ notifications : receives
    users ||--o| notification_preferences : configures
    products ||--o{ invoices : contains
    products ||--o{ service_records : logs
    products ||--o{ notifications : triggers

    users {
        uuid id PK
        string name
        string email UK
        string phone
        string password_hash
        string profile_image
        datetime created_at
        datetime updated_at
    }

    products {
        uuid id PK
        uuid user_id FK
        string name
        string category
        string brand
        string model
        string serial_number
        date purchase_date
        decimal purchase_price
        string seller
        string store_location
        date warranty_start_date
        date warranty_end_date
        datetime created_at
        datetime updated_at
    }

    invoices {
        uuid id PK
        uuid product_id FK
        string filename
        string original_filename
        integer file_size
        string mime_type
        string storage_path
        datetime created_at
    }

    service_records {
        uuid id PK
        uuid product_id FK
        date service_date
        string service_type
        string service_provider
        decimal cost
        string notes
        string receipt_path
        datetime created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        string type
        string title
        string message
        boolean is_read
        datetime created_at
    }

    notification_preferences {
        uuid id PK
        uuid user_id FK
        integer notify_before_days
        boolean email_notifications
        boolean push_notifications
    }
```

---

## 5. Prerequisites

Before running the application, ensure the following are installed:
1. **Node.js:** v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **Python:** v3.10, v3.11, or v3.12 ([Download Python](https://www.python.org/))
3. **Database:**
   - Either your cloud PostgreSQL connection string (e.g., Neon.tech)
   - OR the included embedded PostgreSQL package in `.pgsql/` (port 5432).

---

## 6. Complete Step-by-Step Run Commands

Follow these exact steps to run the application locally:

### Step 1: Database Setup & Startup

#### Option A: Using Cloud PostgreSQL (Neon.tech - Recommended)
Configure your `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>/neondb?sslmode=require
```

#### Option B: Using the Included Embedded PostgreSQL (Port 5432)
In a **PowerShell** terminal at `d:\billnow`:
```powershell
& "d:\billnow\.pgsql\pg\bin\postgres.exe" -D "d:\billnow\.pgsql\data"
```

---

### Step 2: Backend Setup & Startup

Open a **PowerShell** terminal and navigate to `backend`:

```powershell
cd d:\billnow\backend

# 1. Create Python virtual environment (if not already created)
python -m venv .venv

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Run database migrations to apply latest schema (including phone column)
alembic upgrade head

# 5. Start the FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- Backend API: **`http://127.0.0.1:8000`**
- Interactive Swagger API Documentation: **`http://127.0.0.1:8000/docs`**

---

### Step 3: Frontend Setup & Startup

Open a **new terminal** and navigate to `frontend`:

```powershell
cd d:\billnow\frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

- Open **`http://localhost:5173`** in your browser.

#### Building Frontend for Production:
```powershell
npm run build
```
*(Produces optimized static assets in `frontend/dist/`)*

---

## 7. Mobile & Email OTP Verification System

BillNow includes a complete OTP authentication flow:

```
┌─────────────────────────────────────────────────────────────┐
│                 Registration & Verification Flow            │
└─────────────────────────────────────────────────────────────┘
                              │
                    Enter Name, Email,
                    Mobile & Password
                              │
                              ▼
                   POST /api/auth/send-otp
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       Dispatches Email                Dispatches Mobile
          OTP Message                     SMS Notice
              └───────────────┬───────────────┘
                              │
                              ▼
                     User Enters 6-Digit
                      Verification Code
                              │
                              ▼
                  POST /api/auth/register
                (with verified OTP & Phone)
                              │
                              ▼
                User Created with Saved Phone
                 & JWT Tokens Issued to App
```

1. **Send OTP (`POST /api/auth/send-otp`):** Generates a secure 6-digit numeric code valid for 10 minutes, checks for existing accounts, sends an email verification code, and logs mobile SMS delivery.
2. **Verify & Register (`POST /api/auth/register`):** Validates the entered code, creates the user account with the verified `phone` and `email`, and logs the user in immediately.
3. **Resend Cooldown:** 30-second countdown timer on the frontend prevents spamming verification requests.
4. **Permanent Phone Storage:** Once registered, the user's actual phone number is displayed across their profile and can be edited anytime under Settings.

---

## 8. Testing & Validation Commands

### Backend Automated Test Suite
The backend contains 63 automated tests covering authentication, password hashing, CRUD APIs, invoice security, and notification triggers:

```powershell
cd d:\billnow\backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

### Frontend Typecheck & Build
```powershell
cd d:\billnow\frontend
npm run lint    # runs tsc --noEmit
npm run build   # runs tsc -b && vite build
```

---

## 9. Directory Structure

```
d:\billnow\
├── .gitignore                       # Git exclusions (uploads, pycache, dist, etc.)
├── APP_CREATION_STEPS.txt           # Mobile App & APK conversion guide
├── README.md                        # Documentation & setup instructions
├── .pgsql\                          # Embedded PostgreSQL runtime
├── backend\                         # FastAPI Python Backend
│   ├── alembic\                     # Database migrations
│   │   └── versions\
│   │       ├── 0001_initial_schema.py
│   │       └── 0002_add_phone.py    # Phone column migration
│   ├── app\
│   │   ├── api\routes\              # REST API endpoints (auth, products, invoices, etc.)
│   │   ├── core\                    # Config, security, JWT, rate limiting, logging
│   │   ├── db\                      # Database connection and session management
│   │   ├── models\                  # SQLAlchemy ORM models (User, Product, Invoice, etc.)
│   │   ├── schemas\                 # Pydantic schemas (auth, user, product, etc.)
│   │   ├── services\                # Storage, email, notifications
│   │   │   └── storage\             # Multi-backend storage service (local, s3, etc.)
│   │   ├── main.py                  # FastAPI application entry point
│   │   └── seed.py                  # Database synchronization script
│   ├── storage\                     # Local private storage for invoices
│   ├── tests\                       # Pytest test suite (63 tests)
│   ├── .env                         # Backend environment variables
│   ├── Procfile                     # Cloud process runner
│   └── requirements.txt             # Python dependencies
├── frontend\                        # React + TypeScript + Vite Frontend
│   ├── public\
│   │   ├── manifest.webmanifest     # PWA manifest
│   │   ├── sw.js                    # PWA service worker
│   │   └── _redirects               # Netlify/Cloudflare SPA redirects
│   ├── src\
│   │   ├── components\
│   │   │   ├── layout\              # AppLayout, AuthLayout, BottomNav
│   │   │   ├── products\            # ProductCard, ProductForm, WarrantyStatusCard
│   │   │   ├── splash\              # Animated SplashScreen
│   │   │   └── ui\                  # Reusable UI primitives (Button, Modal, Input, FAB)
│   │   ├── context\                 # AuthContext, ThemeContext, NotificationContext
│   │   ├── lib\                     # API client, categories list, warranty helpers
│   │   ├── pages\                   # Splash, Login, Register, Dashboard, Products, etc.
│   │   ├── App.tsx                  # React Router configuration
│   │   ├── main.tsx                 # App mount & context providers
│   │   ├── types.ts                 # TypeScript data models
│   │   └── index.css                # Tailwind base styles and mobile utility classes
│   ├── package.json
│   ├── tailwind.config.js           # Custom theme colors and splash keyframes
│   ├── vercel.json                  # Vercel SPA rewrite rules
│   └── vite.config.ts
```

---

## 10. REST API Reference

All API routes are prefixed with `/api`:

### Authentication & Verification (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/send-otp` | Generate and dispatch 6-digit verification code to email & mobile |
| `POST` | `/auth/verify-otp` | Validate verification code |
| `POST` | `/auth/register` | Register a new user with verified phone & email |
| `POST` | `/auth/login` | Login with email & password, returns JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token using refresh token |
| `POST` | `/auth/logout` | Invalidate current session |

### Products (`/products`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | List user's products (search, filter by category/status, paginate) |
| `POST` | `/products` | Create a new product with warranty details |
| `GET` | `/products/{id}` | Get product details by ID |
| `PATCH` | `/products/{id}` | Update product information |
| `DELETE` | `/products/{id}` | Delete a product and its associated invoice and services |

### Invoices (`/invoices`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/invoices/{product_id}` | Upload an invoice document (PDF, JPG, PNG) |
| `GET` | `/invoices/{product_id}/download` | Securely download the product invoice |
| `DELETE` | `/invoices/{product_id}` | Delete an invoice |

### Service History (`/service-records`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/service-records/{product_id}` | List all service records for a product |
| `POST` | `/service-records/{product_id}` | Add a maintenance or repair record |
| `DELETE` | `/service-records/{id}` | Remove a service record |

### Dashboard & Alerts (`/dashboard`, `/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/summary` | Get aggregated warranty statistics (Total, Active, Expiring, Expired) |
| `GET` | `/dashboard/upcoming` | Fetch products with upcoming warranty expirations |
| `GET` | `/notifications` | List warranty alert notifications |
| `PATCH` | `/notifications/{id}/read` | Mark a specific notification as read |
| `POST` | `/notifications/mark-all-read` | Mark all user notifications as read |

### User Profile & Settings (`/settings`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings/profile` | Fetch authenticated user profile |
| `PUT` | `/settings/profile` | Update name, email, or mobile number |
| `POST` | `/settings/change-password` | Change password with current password confirmation |
| `GET` | `/settings/export` | Export all user data as JSON |
| `DELETE` | `/settings/me` | Permanently delete user account |

---

## 11. 100% Free Cloud Deployment Guide

You can deploy the complete BillNow application to the cloud for free with zero credit card required using this proven production stack:

```
┌─────────────────────────────────────────────────────────────┐
│                   100% Free Cloud Stack                     │
├─────────────────┬─────────────────────────┬─────────────────┤
│ Frontend (SPA)  │ Backend API             │ Database        │
│ Vercel          │ Render.com              │ Neon.tech       │
│ Free Forever    │ Free Web Service        │ Free Serverless │
│ Global Edge CDN │ Python 3.12 / FastAPI   │ PostgreSQL 16   │
└─────────────────┴─────────────────────────┴─────────────────┘
```

### Step 1: Push Code to a GitHub Repository
```bash
git add .
git commit -m "feat: complete BillNow mobile-first application"
git push origin main
```

### Step 2: Database (Neon.tech)
Your live database is connected and active:
```
postgresql+psycopg2://neondb_owner:npg_2WuNjZeOQkv1@ep-calm-thunder-bdf3mlwp-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Deploy Backend (Render.com)
1. Sign up for free at [render.com](https://render.com) using your GitHub account.
2. Click **New +** → **Web Service** and select `Pavan-MSV/billnow`.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
4. Add **Environment Variables**:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET`: `billnow-super-secret-jwt-key-production-2026`
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `*`
   - `PYTHON_VERSION`: `3.12.0`
5. Click **Deploy Web Service** and copy your backend URL (`https://billnow-backend.onrender.com`).

### Step 4: Deploy Frontend (Vercel)
1. Sign up for free at [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** → **Project** and import `Pavan-MSV/billnow`.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://billnow-backend.onrender.com`
5. Click **Deploy**.

---

## 12. Mobile Application Conversion Guide

BillNow can be packaged directly into a native Android `.apk` or iOS app in minutes:

### Fast Command Line (Capacitor):
```powershell
cd d:\billnow\frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "BillNow" "com.billnow.app" --web-dir "dist"
npx cap add android
npm run build
npx cap sync
npx cap open android
```
In Android Studio: Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)** to generate your installable APK!

### Fast Online Conversion (No Android Studio Needed):
1. Open [pwabuilder.com](https://www.pwabuilder.com).
2. Enter your live Vercel URL (e.g. `https://billnow.vercel.app`).
3. Click **Package for Stores** → **Android / Google Play** → **Generate Package**.
4. Download the `.zip` file containing your ready-to-install `.apk` and Play Store `.aab` files.

*(For detailed Play Store publishing guidelines, see [APP_CREATION_STEPS.txt](file:///d:/billnow/APP_CREATION_STEPS.txt))*
