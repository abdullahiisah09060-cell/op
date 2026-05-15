// ============================================================
// firebase-config.js — SBA Platform Core Configuration (PROD)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    browserLocalPersistence, 
    setPersistence, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enforce Local Persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("[SBA] Auth persistence error:", err);
});

// ============================================================
// CLOUDINARY CONFIGURATION & HELPERS
// ============================================================
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: "dcnv6v9g0",
  UPLOAD_PRESET: "sba_uploads",
  UPLOAD_API_URL: "https://api.cloudinary.com/v1_1/dcnv6v9g0/image/upload"
};

/**
 * Uploads a file to Cloudinary
 * @param {File} file - The file object from input
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_API_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("[SBA] Cloudinary Upload Error:", error);
    throw error;
  }
};

// ============================================================
// ADMIN CONFIGURATION
// ============================================================
export const ADMIN_EMAIL = "sba.suppor@gmail.com";
export const isAdmin = (email) => email && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

// ============================================================
// FIRESTORE COLLECTION NAMES
// ============================================================
export const DB_COLLECTIONS = {
  USERS: "users",
  TRANSACTIONS: "transactions", // Combined ledger/deposit/withdraw for easier querying
  APPLICATIONS: "applications",
  KYC: "kyc",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings"
};

// ============================================================
// PRODUCTION USER SCHEMA
// ============================================================
export const buildNewUserPayload = (rawData) => {
  const timestamp = new Date().toISOString();
  return {
    uid: rawData.uid || "",
    personalInfo: {
        fullName: rawData.fullName || "",
        username: rawData.username || "",
        email: rawData.email ? rawData.email.toLowerCase().trim() : "",
        phoneNumber: rawData.phoneNumber || "",
        country: rawData.country || "",
        gender: rawData.gender || "",
        dob: rawData.dob || "",
    },
    bankDetails: {
        bankName: rawData.bankName || "",
        accountName: rawData.accountName || "",
        accountNumber: rawData.accountNumber || "",
        routingNumber: rawData.routingNumber || ""
    },
    referral: {
        code: rawData.username ? rawData.username.toLowerCase() : "",
        referredBy: rawData.referredBy || "none",
        referralCount: 0
    },
    status: {
        accountStatus: "active", // active, suspended, restricted
        emailVerified: false,
        kycStatus: "unsubmitted", // unsubmitted, pending, approved, rejected
        isOnline: true
    },
    balances: {
      totalDeposit: 0,
      totalWithdrawal: 0,
      availableBalance: 0,
      vaultBalance: 0,
      awardedGrants: 0
    },
    metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLogin: timestamp
    }
  };
};

// ============================================================
// AUTHENTICATION & ROUTING GUARDS
// ============================================================

/**
 * Observer to get current user
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

/**
 * Comprehensive Route Guard
 * Handles: Unauthenticated, Email Unverified, and Admin Access
 */
export const monitorAuthState = (callback) => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // No user logged in, redirect to login unless already there
            if (!window.location.pathname.includes("login.html") && 
                !window.location.pathname.includes("register") &&
                !window.location.pathname.includes("index.html")) {
                window.location.href = "login.html";
            }
        } else {
            // Check email verification (Skip for admin)
            if (!user.emailVerified && user.email !== ADMIN_EMAIL) {
                if (!window.location.pathname.includes("verify.html")) {
                    window.location.href = "verify.html";
                }
            }
        }
        callback(user);
    });
};

// ============================================================
// SESSION MANAGEMENT
// ============================================================
const SESSION_KEY = "SBA_REG_FLOW";

export const saveRegistrationStep = (data) => {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...data }));
};

export const getRegistrationData = () => JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};

export const clearSession = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await signOut(auth);
    window.location.href = "login.html";
};
