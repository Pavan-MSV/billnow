# BILLNOW — CLOUDFLARE R2 PRIVATE STORAGE SETUP GUIDE
**Project:** BillNow ("Never Forget a Warranty Again")  
**Target:** Private Invoice Storage (₹0/month budget)

---

## 1. Why Cloudflare R2 for BillNow?

Cloudflare R2 is an S3-compatible object storage service with a generous permanent free tier:
* **Storage:** 10 GB/month included free.
* **Class A operations (writes/uploads):** 1,000,000 requests/month included free.
* **Class B operations (reads/downloads):** 10,000,000 requests/month included free.
* **Egress fees:** **₹0 (Zero data transfer fees).** Unlike AWS S3, downloading invoices from R2 never costs anything.

By using **pre-signed URLs**, files are uploaded and downloaded directly between the user's browser/mobile app and Cloudflare R2. The Oracle Cloud VM backend merely signs a temporary authorization token (valid for 15 minutes), consuming negligible CPU and zero VM bandwidth.

---

## 2. Step-by-Step Setup in Cloudflare Dashboard

### Step 2.1: Create a Private Bucket
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left-hand navigation, click **R2 Object Storage**.
3. Click **Create bucket**.
4. Set the **Bucket name** to:
   ```text
   billnow-invoices
   ```
5. Leave the location as **Automatic** (or select your closest region).
6. Click **Create Bucket**.
7. **Important:** Under bucket settings, **do not** enable Public Bucket Access. The bucket must remain completely private.

### Step 2.2: Generate S3-Compatible API Credentials
1. On the main **R2** overview page, click **Manage R2 API Tokens** in the right sidebar.
2. Click **Create API token**.
3. Configure the token:
   * **Token name:** `billnow-backend-token`
   * **Permissions:** `Object Read & Write`
   * **Apply to specific bucket:** Select `billnow-invoices`
   * **TTL:** Leave blank (no expiration) or as preferred.
4. Click **Create API Token**.
5. Copy the following credentials immediately:
   * **Access Key ID**
   * **Secret Access Key**
   * **Endpoint URL:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 3. Backend Configuration

Add the credentials to your production `.env` file on the backend server:

```dotenv
# Storage configuration: Cloudflare R2
STORAGE_BACKEND=s3
STORAGE_BUCKET=billnow-invoices
STORAGE_ACCESS_KEY=<YOUR_R2_ACCESS_KEY_ID>
STORAGE_SECRET_KEY=<YOUR_R2_SECRET_ACCESS_KEY>
STORAGE_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_PUBLIC_URL=

# Max upload limit (in MB)
MAX_UPLOAD_SIZE_MB=10
ALLOWED_UPLOAD_TYPES=application/pdf,image/jpeg,image/png
```

---

## 4. Security & Validation Architecture

1. **Magic Byte Signature Inspection:**  
   Every uploaded file is verified at the binary byte level in `backend/app/services/uploads.py`:
   * PDF files must start with `b"%PDF"`
   * JPEG images must start with `b"\xFF\xD8\xFF"`
   * PNG images must start with `b"\x89PNG\r\n\x1A\n"`
   Any mismatch or disguised executable is rejected immediately with `400 Bad Request`.

2. **Path Traversal Prevention:**  
   Keys are built strictly via `build_invoice_key(user_id, product_id, filename)` which sanitizes filename characters to `[a-zA-Z0-9._-]` and prefixes with UUIDs:
   ```text
   invoices/<user_id>/<product_id>/<random_uuid>-<safe_filename>
   ```

3. **Time-Limited Presigned Access:**  
   The endpoint `GET /api/products/{id}/invoice/url` validates that the requesting user owns the product, then generates a temporary pre-signed URL expiring in **15 minutes** (900 seconds). No public access is ever granted.

4. **Cascading Deletion:**  
   When a product is deleted, or when an account is deleted, the backend issues an S3 `DeleteObject` command, ensuring no orphan files or sensitive receipts linger in the bucket.
