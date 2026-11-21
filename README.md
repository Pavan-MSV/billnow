# BillNow — Smart Warranty & Invoice Vault 📱🛡️

> **“Never Forget a Warranty Again.”**

BillNow is a **mobile-first, app-style web application** built to track product purchases, organize invoices, monitor warranty expirations, and record service histories. The entire user experience is crafted to feel like a native Android/iOS mobile application with touch-friendly controls, bottom navigation, and clean phone dimensions (`max-w-[440px]`).

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
- [7. Demo Account Credentials](#7-demo-account-credentials)
- [8. Testing & Validation Commands](#8-testing--validation-commands)
- [9. Directory Structure](#9-directory-structure)
- [10. REST API Reference](#10-rest-api-reference)

---

## 1. System Overview

- **Mobile Viewport Target:** Designed primarily for modern mobile screens (360×800, 375×812, 390×844, 412×915).
- **Desktop Adaptation:** Centered in clean phone dimensions (`max-w-[440px]`, full viewport height `min-h-dvh`), with no fake hardware bezels or mock status bars.
- **Data Persistence:** Real PostgreSQL relational database via SQLAlchemy ORM. All products, invoices, and service records are persistently stored and isolated per user.
- **PWA-Ready:** Progressive Web App manifest (`manifest.webmanifest`) and service worker (`sw.js`) supporting installability and offline caching.

---

## 2. Pin-to-Pin Feature Breakdown

### 🌟 Opening & Splash Screen
- **Branded Animated Splash:** Displays the BillNow logo mark, app name, and tagline *“Never Forget a Warranty Again.”*
- **Animation Sequence:** Logo zooms smoothly from 90% → 100%, verified shield badge pops, brand typography fades in, and progress bar animates.
- **Smart Navigation:** Auto-transitions after 2.5s directly to `/dashboard` (if already logged in) or `/login` (if unauthenticated).
- **Skip Action:** One-tap "Skip" button for immediate entry.

### 🔐 Authentication Flow
- **JWT Architecture:** Secure HTTP access and refresh tokens.
- **User Isolation:** Users strictly see only their own products, invoices, service records, and alerts.
- **Demo Quick-Login:** 1-tap "Quick Demo Login (Pavan Kumar)" button on the login screen for instant evaluation.
- **Registration Screen:** Full name, email, password, and password confirmation with client-side and server-side validation.

### 🏠 Home / Dashboard (`/dashboard`)
- **Header:** Personalized greeting (`Hello, Pavan 👋`), small BillNow logo mark, notification bell with unread badge, and profile avatar.
- **Warranty Summary Grid:** 4 compact cards:
  - **Total Products** (e.g. 7)
  - **Active Warranties** (e.g. 5)
  - **Expiring Soon** (e.g. 1)
  - **Expired** (e.g. 1)
- **Warranty Alerts Section:** High-priority cards:
  - ⚠️ *Expiring Soon:* Highlight card (e.g. Samsung Refrigerator — 18 days left) with a direct "View" button.
  - ✓ *Active Highlights:* Cards showing remaining warranty periods (e.g. LG Washing Machine — 10 months).
- **My Products Feed:** Compact, touch-friendly product cards displaying category icon, brand, model, purchase date, status badge, and days left.
- **Floating Action Button (FAB):** Fixed `+ Add Product` button for quick access.

### 📦 Product Management & Details (`/products`, `/products/:id`)
- **13 Recognized Categories with Icons:**
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
- User Profile Card with avatar, name, email, and member since date.
- **My BillNow Statistics Grid:** Quick counts for products, invoices, active warranties, and expired items.
- **Personal Information Modal:** Update full name, email, and phone number.
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
├──────────────────────────────┴──────────────────────────────┤
│                         Storage                             │
│ - PostgreSQL 16 (Relational DB)                             │
│ - Local Secure Filesystem Storage (Invoices)                │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5.6, Vite 6, Tailwind CSS 3.4, Lucide React, Axios, React Router DOM 6 |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PyJWT, Passlib (bcrypt) |
| **Database** | PostgreSQL 16 (Embedded `.pgsql` provided or External PostgreSQL) |
| **Invoice Storage** | Secure local filesystem (`backend/storage`) with MIME & size validation |

---

## 4. Database Schema

The database consists of 6 primary relational tables:

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
        string password_hash
        string phone
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
3. **PostgreSQL:**
   - Either use the embedded PostgreSQL package included in `.pgsql/` (requires Java 17+ for the initial launcher, or the extracted binary `postgres.exe` in `.pgsql/pg/bin/`)
   - OR use an existing local PostgreSQL 14+ server.

---

## 6. Complete Step-by-Step Run Commands

Follow these exact steps to start the complete application:

### Step 1: Database Setup & Startup

#### Option A: Using the Included Embedded PostgreSQL (Port 5432)
In a **PowerShell** terminal at the project root (`d:\billnow`):

```powershell
# Start the PostgreSQL service using the bundled data directory
& "d:\billnow\.pgsql\pg\bin\postgres.exe" -D "d:\billnow\.pgsql\data"
```
*(Leave this terminal running)*

> **Alternative (Background via pg_ctl):**
> ```powershell
> & "d:\billnow\.pgsql\pg\bin\pg_ctl.exe" -D "d:\billnow\.pgsql\data" -l "d:\billnow\.pgsql\pg.log" start
> ```

#### Option B: Using an Existing Local PostgreSQL Server
Ensure PostgreSQL is running on port `5432` with a database named `billnow`:
```sql
CREATE DATABASE billnow;
```

---

### Step 2: Backend Setup & Startup

Open a **new terminal** and navigate to `backend`:

#### On Windows (PowerShell):
```powershell
cd d:\billnow\backend

# 1. Create Python virtual environment (if not already created)
python -m venv .venv

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Verify/configure environment file
# (backend/.env is pre-configured with DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/billnow)

# 5. Run database migrations to create all tables
alembic upgrade head

# 6. Seed demo user and sample products (Pavan Kumar, Samsung Fridge, LG Washing Machine, etc.)
python -m app.seed

# 7. Start the FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### On Linux / macOS (Bash):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- Backend API will be live at: **`http://127.0.0.1:8000`**
- Interactive Swagger API Documentation: **`http://127.0.0.1:8000/docs`**
- Health Check: **`http://127.0.0.1:8000/health`**

---

### Step 3: Frontend Setup & Startup

Open a **new terminal** and navigate to `frontend`:

#### On Windows (PowerShell) / Linux / macOS:
```bash
cd d:\billnow\frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

- Vite will run the frontend at: **`http://localhost:5173`**
- Open **`http://localhost:5173`** in your browser.

#### Building Frontend for Production:
```bash
npm run build
```
*(Produces optimized static assets in `frontend/dist/`)*

---

## 7. Demo Account Credentials

A pre-configured demo account with rich data is ready for immediate testing:

| Field | Value |
|---|---|
| **Email** | `demo@billnow.app` |
| **Password** | `Demo1234` |
| **User Name** | Pavan Kumar |
| **Pre-seeded Products** | Samsung Refrigerator (Expiring in ~18 days)<br>LG Washing Machine (Active — 10 months remaining)<br>Samsung 55" 4K Smart TV<br>Dell XPS 13 Laptop<br>Sony WH-1000XM5 Headphones<br>LG Dual Inverter Air Conditioner |

> **Quick Access:** You can also click the **"Quick Demo Login (Pavan Kumar)"** button on the `/login` screen to sign in with one tap.

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
├── .pgsql\                          # Embedded PostgreSQL 16 runtime and database files
│   ├── bin\                         # postgres.exe, pg_ctl.exe, etc.
│   └── data\                        # Database cluster directory
├── backend\                         # FastAPI Python Backend
│   ├── alembic\                     # Database migration revisions
│   ├── app\
│   │   ├── api\v1\                  # REST API endpoints (auth, products, invoices, etc.)
│   │   ├── core\                    # Config, security, JWT, rate limiting, logging
│   │   ├── db\                      # Database connection and session management
│   │   ├── models\                  # SQLAlchemy ORM models (User, Product, Invoice, etc.)
│   │   ├── schemas\                 # Pydantic request/response schemas
│   │   ├── services\                # Business logic (storage, notifications, export)
│   │   ├── main.py                  # FastAPI application entry point
│   │   └── seed.py                  # Seed script for demo data
│   ├── storage\                     # Private local storage for user invoice files
│   ├── tests\                       # Pytest test suite (63 tests)
│   ├── .env                         # Backend environment variables
│   └── requirements.txt             # Python dependencies
├── frontend\                        # React + TypeScript + Vite Frontend
│   ├── public\
│   │   ├── manifest.webmanifest     # PWA manifest
│   │   └── sw.js                    # PWA service worker
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
│   │   └── index.css                # Tailwind base styles and mobile utility classes
│   ├── package.json
│   ├── tailwind.config.js           # Custom theme colors and splash keyframes
│   └── vite.config.ts
└── README.md                        # Documentation
```

---

## 10. REST API Reference

All API routes are prefixed with `/api/v1`:

### Authentication (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
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

### User Profile & Settings (`/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Fetch authenticated user profile |
| `PATCH` | `/users/me` | Update name, email, or phone number |
| `POST` | `/users/change-password` | Change password with current password confirmation |
| `GET` | `/users/export` | Export all user data as JSON |
| `DELETE` | `/users/me` | Permanently delete user account |

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
│ Global Edge CDN │ Python 3 / FastAPI      │ PostgreSQL 16   │
└─────────────────┴─────────────────────────┴─────────────────┘
```

### Step 1: Push Code to a GitHub Repository
1. In your local terminal at `D:\billnow`:
   ```bash
   git init
   git add .
   git commit -m "feat: initial BillNow mobile-first application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/billnow.git
   git push -u origin main
   ```

### Step 2: Create a Free PostgreSQL Database (Neon.tech)
1. Sign up for free at [neon.tech](https://neon.tech) (using GitHub).
2. Click **Create Project**, name it `billnow`, and select the region closest to you.
3. Copy the generated connection string (e.g., `postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require`).

### Step 3: Deploy Backend (Render.com)
1. Sign up for free at [render.com](https://render.com) using your GitHub account.
2. Click **New +** → **Web Service**.
3. Connect your `billnow` GitHub repository.
4. Configure the Web Service settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && alembic upgrade head && python -m app.seed`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string from Step 2)*
   - `JWT_SECRET`: *(A long random secret string)*
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `*` *(or your Vercel URL)*
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://billnow-backend.onrender.com`).

### Step 4: Deploy Frontend (Vercel)
1. Sign up for free at [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** → **Project** and import your `billnow` repository.
3. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: *(Your Render backend URL from Step 3, e.g. `https://billnow-backend.onrender.com`)*
5. Click **Deploy**.
6. Vercel will deploy your site globally with a free SSL domain (e.g., `https://billnow.vercel.app`).

