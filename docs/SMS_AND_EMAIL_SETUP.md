# BillNow — Real OTP Delivery Guide (SMS & Email)

BillNow provides authentic two-factor OTP verification for user registration. Users can choose to receive their 6-digit verification code either via **Mobile SMS** or via **Email**.

Both options run on ₹0 free-tier cloud services.

---

## 1. Google Firebase Phone Authentication (Recommended for SMS: 10,000 Free SMS/Month)

Firebase Phone Authentication uses Google's worldwide SMS delivery network to send genuine verification codes to mobile devices. Google provides **10,000 free phone verifications every month** at ₹0.

### Step-by-Step Setup:
1. Open the [Firebase Console](https://console.firebase.google.com/) and go to your **`billnow-app`** project.
2. In the left menu, navigate to **Build** -> **Authentication**.
3. Go to the **Sign-in method** tab.
4. Click **Phone**, toggle **Enable**, and click **Save**.
5. Go to **Project settings** (gear icon) -> **General** tab.
6. Under **Your apps**, click the **Web icon (`</>`)** to register a web app (name it `BillNow Web`).
7. Copy the `firebaseConfig` keys provided by Google.
8. In your frontend environment (Vercel Project Settings -> Environment Variables, or `frontend/.env`), add:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=billnow-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=billnow-app
   VITE_FIREBASE_STORAGE_BUCKET=billnow-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   ```
9. In Firebase Console -> **Authentication** -> **Settings** -> **Authorized domains**, ensure your Vercel URL (e.g. `billnow-one.vercel.app`) and `localhost` are listed.

Now, whenever a user clicks **[ 📱 Mobile SMS ]**, Firebase dispatches the SMS directly from Google's infrastructure and verifies the code with invisible reCAPTCHA protection.

---

## 2. Fast2SMS (Alternative: Free India SMS Gateway)

Fast2SMS is the easiest way to send real SMS verification codes to Indian mobile numbers (+91) with zero upfront cost.

### How to set up Fast2SMS:
1. Sign up for free at [https://www.fast2sms.com/](https://www.fast2sms.com/).
2. You will receive free wallet balance immediately upon signing up.
3. Go to **Dev API** in the dashboard and copy your **API Authorization Key**.
4. In your backend environment (Render Dashboard -> Environment Variables or `.env`), add:
   ```env
   SMS_ENABLED=true
   SMS_PROVIDER=fast2sms
   FAST2SMS_API_KEY=your_fast2sms_api_key_here
   ```

When a user selects **Mobile SMS**, BillNow automatically posts to Fast2SMS's Quick OTP route and delivers the 6-digit code directly to their phone.

---

## 2. Twilio (Free Global SMS Gateway)

If you prefer global SMS delivery:
1. Create a free trial account at [https://www.twilio.com/](https://www.twilio.com/) (includes \$15 in free trial credits).
2. Get your **Account SID**, **Auth Token**, and an assigned **Twilio Phone Number**.
3. In your backend environment variables, add:
   ```env
   SMS_ENABLED=true
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=+1XXXXXXXXXX
   ```

---

## 3. Brevo (Free Email Delivery — 300 emails/day)

Brevo provides 300 free transactional emails every single day at ₹0.

### How to set up Brevo SMTP:
1. Sign up at [https://www.brevo.com/](https://www.brevo.com/).
2. Go to **Settings** -> **SMTP & API Keys**.
3. Create an SMTP Master Key.
4. In your backend environment (Render Dashboard or `.env`), add:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your_brevo_account_email@gmail.com
   SMTP_PASSWORD=your_brevo_smtp_master_key
   SMTP_FROM=BillNow <no-reply@yourdomain.com>
   SMTP_USE_TLS=true
   ```

### Alternative: Gmail App Password (500 free emails/day)
If you prefer using your personal or business Gmail address:
1. Enable 2-Factor Authentication on your Google Account.
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and create an **App Password** for "BillNow".
3. In your backend environment variables:
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=vamaravallipavanpavan@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   SMTP_FROM=BillNow <vamaravallipavanpavan@gmail.com>
   SMTP_USE_TLS=true
   ```

---

## 4. How the New Registration Flow Works

1. **User Enters Details:** Full Name, Email, Mobile Number, and Password.
2. **Channel Selection:**
   - User chooses **[ ✉️ Email OTP ]** OR **[ 📱 Mobile SMS ]**.
   - Button reflects choice: "Send Code via Email" or "Send Code via SMS".
3. **Real Dispatch:**
   - Backend routes the 6-digit OTP to the chosen channel (via Brevo/Gmail SMTP or Fast2SMS/Twilio).
   - The test code autofill button has been permanently removed from the user interface.
4. **Seamless Fallback:**
   - On the verification screen, if SMS delivery has carrier delay, the user can tap:
     *"Didn't receive SMS? Send code to email instead"*
   - Or if email is delayed in spam filter:
     *"Didn't receive email? Send code via SMS instead"*
