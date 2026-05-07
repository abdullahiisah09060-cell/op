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

// Initialize
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ADMIN CONSTANT
export const ADMIN_EMAIL = "sba.support@gmail.com";

// SECURE SESSION MANAGEMENT
export const saveSession = (data) => sessionStorage.setItem('SBA_CORE_DATA', JSON.stringify(data));
export const getSession = () => JSON.parse(sessionStorage.getItem('SBA_CORE_DATA'));
export const clearSession = () => { sessionStorage.clear(); auth.signOut(); };
