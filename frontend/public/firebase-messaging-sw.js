importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase config — must be kept in sync with .env / firebase.js
// Service workers cannot use import.meta.env, so values are hardcoded here.
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
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const title = payload.notification?.title || payload.data?.title || 'JyotishLink';
    const body = payload.notification?.body || payload.data?.body || '';
    const type = payload.data?.type || '';

    // Choose icon based on notification type
    const iconMap = {
      incoming_call: '📞',
      incoming_chat: '💬',
      call_accepted: '📞',
      order_confirmed: '🎉',
      order_update: '📦',
      order_shipped: '🚚',
      order_delivered: '🎁',
      order_cancelled: '❌',
      withdrawal_processed: '💰',
      broadcast: '📢',
    };

    const notificationOptions = {
      body,
      icon: 'https://res.cloudinary.com/dut8feomk/image/upload/v1781699113/astrotalk_branding/otdilt1kns6zctiud2wq.png',
      badge: 'https://res.cloudinary.com/dut8feomk/image/upload/v1781699113/astrotalk_branding/otdilt1kns6zctiud2wq.png',
      vibrate: type === 'incoming_call' || type === 'incoming_chat'
        ? [200, 100, 200, 100, 200] // Urgent vibration for calls/chats
        : [100, 50, 100],           // Standard vibration for others
      tag: type || 'jyotishlink-notification',
      renotify: true,
      // Pass the entire data payload so the click handler can read deep link info
      data: payload.data || {},
    };

    // Always show notification manually.
    // Firebase Web SDK on Windows does NOT reliably auto-show push notifications
    // even when payload.notification is present. We must call showNotification explicitly.
    self.registration.showNotification(title, notificationOptions);
  });
} catch (error) {
  console.warn('Service worker Firebase config not set yet:', error.message);
}

// ─── Notification Click → Deep Link ───────────────────────────────────
// We rely entirely on Firebase's native handling here. 
// Since our backend sets `webpush.fcmOptions.link`, Firebase automatically opens the correct URL 
// and focuses the tab if it's already open. Having a manual listener here could cause 
// duplicate tabs to open when the user clicks a notification.
/*
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Try to find an existing window/tab from our origin
      const matchingClient = clientsArr.find(
        (c) => c.url.includes(self.location.origin) && 'focus' in c
      );

      if (matchingClient) {
        // Navigate the existing tab to the deep link and focus it
        return matchingClient.navigate(targetUrl).then(() => matchingClient.focus());
      }

      // No existing tab found — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});
*/
