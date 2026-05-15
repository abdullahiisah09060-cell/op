// ============================================================
// firebase-config.js — SBA Platform Core Configuration (PROD)
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enforce Local Persistence (Keeps users logged in across refreshes)
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
  if (!file) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_API_URL, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Cloudinary upload failed");
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
  TRANSACTIONS: "transactions",
  APPLICATIONS: "applications",
  KYC: "kyc",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings"
};

// ============================================================
// PRODUCTION USER SCHEMA (Deep Synchronization)
// ============================================================
export const buildNewUserPayload = (rawData) => {
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
        isOnline: true,
        lastSeen: serverTimestamp()
    },
    balances: {
      totalDeposit: 0,
      totalWithdrawal: 0,
      availableBalance: 0,
      vaultBalance: 0,
      awardedGrants: 0
    },
    metadata: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        registrationStep: rawData.registrationStep || 1
    }
  };
};

// ============================================================
// AUTHENTICATION & ROUTING GUARDS
// ============================================================

/**
 * Fetches user data from Firestore
 */
export const getUserData = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, DB_COLLECTIONS.USERS, uid));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error("[SBA] Error fetching user data:", error);
        return null;
    }
};

/**
 * Comprehensive Route Guard
 * Logic: 
 * 1. If not logged in -> redirect to login (except public pages)
 * 2. If logged in but email not verified -> redirect to verify (except Admin)
 */
export const monitorAuthState = (callback) => {
    onAuthStateChanged(auth, async (user) => {
        const path = window.location.pathname;
        const isPublicPage = path.includes("login.html") || 
                             path.includes("register") || 
                             path.includes("index.html") || 
                             path.includes("forgot-password.html");

        if (!user) {
            if (!isPublicPage) {
                window.location.href = "login.html";
            }
        } else {
            // Check verification status
            if (!user.emailVerified && user.email !== ADMIN_EMAIL) {
                if (!path.includes("verify.html") && !isPublicPage) {
                    window.location.href = "verify.html";
                }
            }
        }
        if (callback) callback(user);
    });
};

// ============================================================
// SESSION MANAGEMENT (For Multi-step Registration)
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
