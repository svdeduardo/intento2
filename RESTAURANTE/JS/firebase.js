// JS/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqx2D9tw2cdJ-ad3fOrUIqa5NH7Fqc-Sc",
  authDomain: "app-agenda-1002d.firebaseapp.com",
  projectId: "app-agenda-1002d",
  storageBucket: "app-agenda-1002d.firebasestorage.app",
  messagingSenderId: "974267820905",
  appId: "1:974267820905:web:ad0da3a156b43e2d266bf8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);