// ============================================================
// firebase-config.js — SBA Platform Core Configuration
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

// Enforce Local Persistence to handle seamless transitions on mobile browsers
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("[SBA] Auth persistence error:", err);
});

/** Firebase Firestore instance */
export const db = getFirestore(app);

/** Firebase Storage instance (Fallback configuration) */
export const storage = getStorage(app);

// ============================================================
// CLOUDINARY CONFIGURATION (Centralized Upload Configurations)
// ============================================================
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: "dcnv6v9g0", // Replace with your verified Cloudinary cloud name if different
  UPLOAD_PRESET: "sba_uploads", // Replace with your active unsigned upload preset name
  UPLOAD_API_URL: "https://api.cloudinary.com/v1_1/dcnv6v9g0/image/upload"
};

// ============================================================
// ADMIN CONFIGURATION
// ============================================================

/** The designated admin email for the SBA platform */
export const ADMIN_EMAIL = "sba.suppor@gmail.com";

/**
 * Check if a given email belongs to the admin account.
 * @param {string} email - The email address to check.
 * @returns {boolean} True if admin, false otherwise.
 * */
export const isAdmin = (email) => email && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

// ============================================================
// FIRESTORE COLLECTION NAMES (Centralized Source of Truth)
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
// PRODUCTION DATABASE PROFILE SCHEMAS
// Prevents missing data payloads and broken views in admin dashboard.
// ============================================================

/**
 * Constructs a perfectly normalized, sanitized payload for a new user document.
 * This guarantees that every single field the admin workspace expects to read is initialized cleanly.
 * @param {Object} rawData - Combined inputs from registration step 1 and step 2.
 * @returns {Object} Cleaned, production-ready Firestore document map.
 */
export const buildNewUserPayload = (rawData) => {
  const timestamp = new Date().toISOString();
  return {
    uid: rawData.uid || "",
    fullName: rawData.fullName || "",
    username: rawData.username || "",
    email: rawData.email ? rawData.email.toLowerCase().trim() : "",
    phoneNumber: rawData.phoneNumber || "",
    country: rawData.country || "",
    gender: rawData.gender || "",
    referralCode: rawData.referralCode || "",
    referredBy: rawData.referredBy || "",
    
    // Status Trackers
    accountStatus: "active", // active, suspended, restricted
    verificationStatus: {
      emailVerified: false,
      kycStatus: "unsubmitted", // unsubmitted, pending, approved, rejected
    },
    
    // Balances & Financial Ledger Foundations
    balances: {
      totalDeposit: 0,
      totalWithdrawal: 0,
      availableBalance: 0,
      vaultBalance: 0,
      awardedGrants: 0
    },
    
    // Meta Tracking
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLogin: timestamp
  };
};

// ============================================================
// ASYNC AUTHENTICATION ROUTING HELPERS
// Resolves asynchronous race-conditions across sub-pages on load.
// ============================================================

/**
 * Promisified observer wrapper to reliably get the currently logged-in user context.
 * @returns {Promise<Object|null>} Resolves with User object or null if unauthorized.
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// ============================================================
// REGISTRATION SESSION FLOW (Multi-step Client Session Memory)
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
 * Alias for saveRegistrationStep — for semantic clarity across multi-step flows.
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
 * Full session clear — removes registration data AND signs the user out cleanly.
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
