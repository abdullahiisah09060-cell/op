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

// Initialize Firebase App Instance
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Session Persistence Matrix Instantly
(async () => {
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (err) {
        console.error("[SBA Core] Critical Exception: Authorization Persistence initialization failed:", err);
    }
})();

// ============================================================
// CLOUDINARY CONFIGURATION & HELPERS
// ============================================================
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: "dcnv6v9g0",
  UPLOAD_PRESET: "sba_uploads",
  UPLOAD_API_URL: "https://api.cloudinary.com/v1_1/dcnv6v9g0/image/upload"
};

/**
 * Uploads an isolated raw file resource payload directly into Cloudinary CDN
 * @param {File} file - Target raw binary asset stream
 * @returns {Promise<string|null>} Dynamic string mapping to cloud secure URL resource
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
    if (!response.ok) throw new Error("Cloudinary CDN rejected binary file ingestion processing parameters.");
    const data = await response.json();
    return data.secure_url || null;
  } catch (error) {
    console.error("[SBA Core] Cloudinary Subsystem Fault Layer:", error);
    throw error;
  }
};

// ============================================================
// ADMINISTRATIVE ROOT PROVISIONS
// ============================================================
export const ADMIN_EMAIL = "sba.suppor@gmail.com";
export const isAdmin = (email) => {
    if (!email) return false;
    return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};

// ============================================================
// DATA COLLECTIONS MAP
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
// PRODUCTION USER SCHEMA (Deep Functional Model Mapping)
// ============================================================
export const buildNewUserPayload = (rawData) => {
  const normalizedEmail = rawData.email ? rawData.email.toLowerCase().trim() : "";
  const baseUsername = rawData.username ? rawData.username.replace(/[^a-zA-Z0-9]/g, "") : "user";
  
  return {
    uid: rawData.uid || "",
    personalInfo: {
        fullName: (rawData.fullName || "").trim(),
        username: baseUsername,
        email: normalizedEmail,
        phoneNumber: (rawData.phoneNumber || "").trim(),
        country: rawData.country || "",
        gender: rawData.gender || "",
        dob: rawData.dob || ""
    },
    bankDetails: {
        bankName: rawData.bankName || "",
        accountName: rawData.accountName || "",
        accountNumber: rawData.accountNumber || "",
        routingNumber: rawData.routingNumber || ""
    },
    referral: {
        code: baseUsername.toLowerCase(),
        referredBy: rawData.referredBy || "none",
        referralCount: 0
    },
    status: {
        accountStatus: "active", // State Map: active | suspended | restricted
        emailVerified: false,
        kycStatus: "unsubmitted", // State Map: unsubmitted | pending | approved | rejected
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
        registrationStep: Number(rawData.registrationStep) || 1
    }
  };
};

// ============================================================
// CORE DATA FETCH API
// ============================================================
export const getUserData = async (uid) => {
    if (!uid) return null;
    try {
        const userDoc = await getDoc(doc(db, DB_COLLECTIONS.USERS, uid));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error("[SBA Core] Data Fetch Exception Engine Intercept:", error);
        return null;
    }
};

// ============================================================
// AUTOMATED AUTHENTICATION INTERCEPTOR & SAFE ROUTING ROUTER
// ============================================================
export const monitorAuthState = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        const path = window.location.pathname;
        
        // Dynamic regular expression matrix mapping parameters to capture clean URLs alongside Vercel deployments
        const isPublicPage = /\/(index\.html)?$/i.test(path) || 
                             /login/i.test(path) || 
                             /register/i.test(path) || 
                             /forgot-password/i.test(path);

        const isVerifyPage = /verify/i.test(path);

        if (!user) {
            // Unauthenticated intercept mapping parameters
            if (!isPublicPage) {
                window.location.href = "login.html";
                return;
            }
        } else {
            const systemAdmin = isAdmin(user.email);
            
            // Sync user document parameter mappings matching real-time verification conditions
            if (user.emailVerified && !systemAdmin) {
                try {
                    const userRef = doc(db, DB_COLLECTIONS.USERS, user.uid);
                    await updateDoc(userRef, {
                        "status.emailVerified": true,
                        "status.isOnline": true,
                        "status.lastSeen": serverTimestamp()
                    });
                } catch (e) {
                    console.warn("[SBA Core] Background pipeline notice: Local Document sync deferred:", e);
                }
            }

            // Route execution evaluations matching validation targets
            if (!user.emailVerified && !systemAdmin) {
                if (!isVerifyPage && !isPublicPage) {
                    window.location.href = "verify.html";
                    return;
                }
            } else {
                // If user lands on registration screens while inside an authenticated pipeline state
                if (isPublicPage && !path.includes("index.html")) {
                    window.location.href = "dashboard.html";
                    return;
                }
            }
        }
        
        if (callback) callback(user);
    });
};

// ============================================================
// PERSISTENT MULTI-STEP SESSION REGISTRATION SUBSYSTEM
// ============================================================
const SESSION_KEY = "SBA_REGISTRATION_DATA_FLOW";

export const saveRegistrationStep = (data) => {
    try {
        const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...data }));
    } catch (e) {
        console.error("[SBA Core] Session engine write collision:", e);
    }
};

export const getRegistrationData = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
    } catch (e) {
        console.error("[SBA Core] Session engine read serialization failure:", e);
        return {};
    }
};

export const clearSession = async () => {
    try {
        sessionStorage.removeItem(SESSION_KEY);
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("[SBA Core] Termination sequence fault:", error);
        window.location.href = "login.html";
    }
};
