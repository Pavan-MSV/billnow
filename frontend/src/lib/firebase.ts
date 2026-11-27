/**
 * Firebase Client SDK configuration for Phone Auth (SMS OTP) & FCM.
 * 
 * Provides:
 * - 10,000 free SMS phone verifications per month via Google Firebase Authentication.
 * - Invisible reCAPTCHA verification to prevent SMS toll abuse.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app = getApps().length
  ? getApp()
  : isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;

// Cache the active confirmation result and verifier for the phone session
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
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to your frontend .env file.'
    );
  }

  const formatted = formatE164Phone(phone);

  // Clean up any existing verifier
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
