// firebase-config.js - The Core Foundation
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// Your NEW Premium Project Config
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

// Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Added storage for KYC/receipt uploads

/** * GLOBAL SESSION HELPERS 
 * Keeps user data active across pages without extra database hits
 */
export const saveUserSession = (data) => {
    sessionStorage.setItem('sba_user_data', JSON.stringify(data));
};

export const getUserSession = () => {
    const data = sessionStorage.getItem('sba_user_data');
    return data ? JSON.parse(data) : null;
};

export const clearUserSession = () => {
    sessionStorage.removeItem('sba_user_data');
    auth.signOut();
};
