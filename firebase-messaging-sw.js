// 파이어베이스 라이브러리 불러오기 (백그라운드용)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ⚠️ 여기에도 본인의 firebaseConfig 코드를 똑같이 넣어주세요!
const firebaseConfig = {
  apiKey: "AIzaSyD1An_fN5nk0ZpfANTL_6h1zzKXYa6OiPs",
  authDomain: "hwt-app-fcd56.firebaseapp.com",
  projectId: "hwt-app-fcd56",
  storageBucket: "hwt-app-fcd56.firebasestorage.app",
  messagingSenderId: "697712630635",
  appId: "1:697712630635:web:ee0edaeff5d71e72644a2e"
};

// 파수꾼 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 화면이 꺼져있거나 앱이 닫혀있을 때 알림을 받으면 실행되는 로직
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 알림 수신: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // 알림창에 뜰 앱 아이콘
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});