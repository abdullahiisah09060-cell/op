import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

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

// ADMIN CONFIGURATION
export const ADMIN_EMAIL = "sba.suppor@gmail.com"; // Matches your specific requirement

/**
 * Utility to check if the current user is the Admin
 * @param {string} email 
 * @returns {boolean}
 */
export const isAdmin = (email) => email === ADMIN_EMAIL;

// SECURE DATA PERSISTENCE
// Used to pass data between registration steps before final Firestore commit
export const saveRegistrationStep = (data) => {
    const existing = JSON.parse(sessionStorage.getItem('SBA_REG_FLOW')) || {};
    const updated = { ...existing, ...data };
    sessionStorage.setItem('SBA_REG_FLOW', JSON.stringify(updated));
};

export const getRegistrationData = () => JSON.parse(sessionStorage.getItem('SBA_REG_FLOW')) || {};

export const clearSession = () => { 
    sessionStorage.removeItem('SBA_REG_FLOW');
    auth.signOut(); 
};
