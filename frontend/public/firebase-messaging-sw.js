importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// You should inject your Firebase config here, or the user can update this file.
// For the service worker to receive background messages, it needs access to initializeApp.
const firebaseConfig = {
  apiKey: "AIzaSyDM5MCTT9-JLxme85T5XMl8iCb1V8DTruc",
  authDomain: "jyotishlink-8ef22.firebaseapp.com",
  projectId: "jyotishlink-8ef22",
  storageBucket: "jyotishlink-8ef22.firebasestorage.app",
  messagingSenderId: "13334177512",
  appId: "1:13334177512:web:1b9362fd433a7dd9ac8b5d"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.warn("Service worker Firebase config not set yet.");
}
