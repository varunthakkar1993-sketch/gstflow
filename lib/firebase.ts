import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCjS-W63HlCYXhcBugHHOdXmHRDgj6FKfo",
  authDomain: "invoiceflow-prod-6134d.firebaseapp.com",
  projectId: "invoiceflow-prod-6134d",
  storageBucket: "invoiceflow-prod-6134d.firebasestorage.app",
  messagingSenderId: "311348806424",
  appId: "1:311348806424:web:a2395b239d5e520f93946d",
  measurementId: "G-CQKW6B4K6V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
