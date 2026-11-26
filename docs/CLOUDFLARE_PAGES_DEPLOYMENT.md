# BILLNOW — CLOUDFLARE PAGES FRONTEND DEPLOYMENT GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target:** Global Static Frontend Hosting  
**Cost:** Strictly ₹0 / month (Cloudflare Pages Free Tier)

---

## 1. Why Cloudflare Pages?

Cloudflare Pages provides global edge distribution across 300+ cities worldwide with:
* Unlimited requests and bandwidth (Zero egress fees).
* Automated CI/CD: every `git push origin main` triggers an instant production build and deployment.
* Free automatic SSL/TLS certificate management.
* Built-in DDoS protection and global CDN caching.

---

## 2. Step-by-Step Deployment Instructions

### Step 2.1: Connect GitHub Repository
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, click **Workers & Pages**.
3. Click **Create application** -> select the **Pages** tab -> click **Connect to Git**.
4. Authorize Cloudflare to access your GitHub account and select:
   ```text
   Pavan-MSV/billnow
   ```
5. Click **Begin setup**.

### Step 2.2: Configure Build Settings
Fill in the deployment parameters:
* **Project name:** `billnow`
* **Production branch:** `main`
* **Framework preset:** `Vite`
* **Root directory:** `frontend`
* **Build command:** `npm run build`
* **Build output directory:** `dist`

### Step 2.3: Configure Environment Variables
Expand **Environment variables (advanced)** and add:
* **Variable name:** `VITE_API_URL`
* **Value:** `https://api.yourdomain.com` (Your Oracle Cloud backend URL or public IP)

Click **Save and Deploy**.

---

## 3. Client-Side SPA Routing Verification

Because BillNow is a single-page React application using `react-router-dom`, direct navigation or refreshing on paths like `/dashboard`, `/products`, `/privacy`, or `/delete-account` requires all requests to rewrite to `/index.html`.

This is handled by `frontend/public/_redirects`:
```text
/*    /index.html   200
```
Cloudflare Pages detects this file during build and applies the rewrite rule automatically.

---

## 4. Custom Domain Setup (Optional)

1. In your Cloudflare Pages project, go to **Custom domains**.
2. Click **Set up a custom domain**.
3. Enter your domain or subdomain (e.g. `app.yourdomain.com`).
4. Cloudflare automatically configures DNS records and provisions an SSL certificate within minutes.
