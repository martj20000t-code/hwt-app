import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// ⚠️ 여기에 방금 복사하신 본인의 firebaseConfig 코드를 덮어쓰세요!
const firebaseConfig = {
  apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
  authDomain: "hwt-app-fcd56.firebaseapp.com",
  projectId: "hwt-app-fcd56",
  storageBucket: "hwt-app-fcd56.firebasestorage.app",
  messagingSenderId: "697712630635",
  appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
};

// 파이어베이스 초기화 (앱 시작)
const app = initializeApp(firebaseConfig);

// 푸시 알림 기능 내보내기
export const messaging = getMessaging(app);