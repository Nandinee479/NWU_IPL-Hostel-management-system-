import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsEvUZVJXjHxT3E7ercDI1MmUkgoFCj-8", 
  authDomain: "hostel-management-e8d74.firebaseapp.com",
  projectId: "hostel-management-e8d74",
  storageBucket: "hostel-management-e8d74.firebasestorage.app",
  messagingSenderId: "338944119934",
  appId: "1:338944119934:web:65463769c0d388c3e80628",
  measurementId: "G-K4L4L4L4L4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
