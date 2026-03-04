importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBHjq_CW9-Nfzw-HHx5DM4HDE1309_2GOY",
  authDomain: "halom-97f18.firebaseapp.com",
  projectId: "halom-97f18",
  storageBucket: "halom-97f18.firebasestorage.app",
  messagingSenderId: "455539520946",
  appId: "1:455539520946:web:9ca0dd7477452065b5e0ab"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '💕 رسالة جديدة', {
    body: body || 'لديك رسالة من القلب',
    icon: icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [300, 100, 300, 100, 500],
    tag: 'halom-ping',
    renotify: true
  });
});
