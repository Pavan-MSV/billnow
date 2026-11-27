/**
 * Firebase Client SDK configuration for BillNow (billnow-7b88c).
 * 
 * Provides:
 * - 10,000 free SMS phone verifications per month via Google Firebase Authentication.
 * - Google Analytics initialization.
 * - Invisible reCAPTCHA verification to protect against SMS abuse.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAwEgrX_7A4PVI_zkQaAdNRjz91ybI9ou4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'billnow-7b88c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'billnow-7b88c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'billnow-7b88c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '111821226245',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:111821226245:web:0cc1d6a1ddfe29e057376c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-M1CBFMBS12',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// Initialize Firebase App
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Analytics safely (checking environment support)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    /* Analytics not supported in current environment */
  });
}

// Cache active confirmation result and verifier for the phone verification session
let activeConfirmationResult: ConfirmationResult | null = null;
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Format raw phone number into standard international E.164 (+91 for 10-digit Indian numbers).
 */
export function formatE164Phone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

/**
 * Send SMS OTP via Google Firebase Phone Authentication.
 * 
 * @param phone Raw phone number (e.g. 7382082800 or +91 98765 43210)
 * @param containerId DOM element ID for the reCAPTCHA container (e.g. "recaptcha-container")
 */
export async function sendFirebasePhoneOtp(phone: string, containerId: string): Promise<void> {
  const formatted = formatE164Phone(phone);

  // Clean up any existing verifier instance
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignore cleanup error
    }
    activeRecaptchaVerifier = null;
  }

  // Initialize invisible reCAPTCHA
  activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });

  // Request SMS OTP from Firebase
  activeConfirmationResult = await signInWithPhoneNumber(
    auth,
    formatted,
    activeRecaptchaVerifier
  );
}

/**
 * Confirm the 6-digit SMS code with Firebase.
 * 
 * @param code 6-digit code received via SMS
 * @returns Firebase ID Token string to pass to backend registration
 */
export async function verifyFirebasePhoneOtp(code: string): Promise<{ idToken: string; phoneNumber?: string }> {
  if (!activeConfirmationResult) {
    throw new Error('No active verification session found. Please request a new SMS code.');
  }

  const userCredential = await activeConfirmationResult.confirm(code);
  const idToken = await userCredential.user.getIdToken();

  return {
    idToken,
    phoneNumber: userCredential.user.phoneNumber ?? undefined,
  };
}

export default app;
