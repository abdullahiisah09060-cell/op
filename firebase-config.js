// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbZx4FTzQtrfWBdSS-7yJ3RTGriyybmAc",
  authDomain: "sba-federal-v15.firebaseapp.com",
  projectId: "sba-federal-v15",
  storageBucket: "sba-federal-v15.firebasestorage.app",
  messagingSenderId: "968263854685",
  appId: "1:968263854685:web:d037910d8c9bd84a91bbb4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export for use in other files
export const auth = getAuth(app);
export const db = getFirestore(app);

/** * GLOBAL HELPERS 
 * These solve the "Name disappearing on refresh" bug.
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
};
