import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getMessaging } from "firebase/messaging";

// 기사님이 직접 확인해주신 현우운수 전용 키값입니다.
const firebaseConfig = {
  apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
  authDomain: "hwt-app-fcd56.firebaseapp.com",
  projectId: "hwt-app-fcd56",
  storageBucket: "hwt-app-fcd56.firebasestorage.app",
  messagingSenderId: "697712630635",
  appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;