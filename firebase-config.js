// ============================================================
// firebase-config.js — SBA Platform Core Configuration
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// NOTE: Firebase Storage is imported but kept available for fallback.
// Primary file/image uploads are handled via Cloudinary.
// Remove if confirmed unused across all files.
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// ============================================================
// FIREBASE PROJECT CONFIGURATION
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyD9sEdygrjz-m1Ou3m9O3L5mXyPEs9LAJM",
  authDomain: "small-business-administration.firebaseapp.com",
  projectId: "small-business-administration",
  storageBucket: "small-business-administration.firebasestorage.app",
  messagingSenderId: "825499942780",
  appId: "1:825499942780:web:4f7e5ceb9d6125e9e5aef9"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance */
export const auth = getAuth(app);

/** Firebase Firestore instance */
export const db = getFirestore(app);

/** Firebase Storage instance (fallback — primary uploads via Cloudinary) */
export const storage = getStorage(app);


// ============================================================
// ADMIN CONFIGURATION
// ============================================================

/** The designated admin email for the SBA platform */
export const ADMIN_EMAIL = "sba.suppor@gmail.com";

/**
 * Check if a given email belongs to the admin account.
 * @param {string} email - The email address to check.
 * @returns {boolean} True if admin, false otherwise.
 */
export const isAdmin = (email) => email === ADMIN_EMAIL;


// ============================================================
// FIRESTORE COLLECTION NAMES (Centralized)
// Use these constants across ALL files to prevent mismatches.
// ============================================================
export const DB_COLLECTIONS = {
  USERS: "users",
  DEPOSITS: "deposits",
  WITHDRAWALS: "withdrawals",
  APPLICATIONS: "applications",
  AWARDS: "awards",
  KYC: "kyc",
  SUPPORT: "support",
  NOTIFICATIONS: "notifications",
  REFERRALS: "referrals",
  LEDGER: "ledger",
  VAULT: "vault"
};


// ============================================================
// REGISTRATION SESSION FLOW
// Stores multi-step registration data in sessionStorage
// before final Firestore commit on register2.html.
// ============================================================

/** Session storage key — single source of truth */
const SESSION_KEY = "SBA_REG_FLOW";

/**
 * Save or merge data into the registration session.
 * @param {Object} data - Key-value pairs to save/merge.
 */
export const saveRegistrationStep = (data) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
    const updated = { ...existing, ...data };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("[SBA] Failed to save registration step:", err);
  }
};

/**
 * Alias for saveRegistrationStep — for semantic clarity in some pages.
 * @param {Object} data - Key-value pairs to save/merge.
 */
export const updateRegistrationStep = (data) => saveRegistrationStep(data);

/**
 * Retrieve all data stored in the current registration session.
 * @returns {Object} The full registration data object, or empty object.
 */
export const getRegistrationData = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
  } catch (err) {
    console.error("[SBA] Failed to read registration data:", err);
    return {};
  }
};

/**
 * Clear ONLY the registration session data (no sign-out).
 * Call this after successfully committing data to Firestore.
 */
export const clearRegistrationSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

/**
 * Full session clear — removes registration data AND signs the user out.
 * Use this on logout or on session expiry.
 * @returns {Promise<void>}
 */
export const clearSession = async () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    await auth.signOut();
  } catch (err) {
    console.error("[SBA] Failed to clear session:", err);
  }
};
