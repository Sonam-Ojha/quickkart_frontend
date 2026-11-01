importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// These values are injected at build time via the HTML — for service workers
// we must hardcode them since import.meta.env is not available here.
// IMPORTANT: Replace these with your actual Firebase web app config values.
firebase.initializeApp({
  apiKey:            'AIzaSyA3BoBq5kd7pF94RG96wSwPCcwYCHk6XMY',
  authDomain:        'jhatpats-fb2a2.firebaseapp.com',
  projectId:         'jhatpats-fb2a2',
  storageBucket:     'jhatpats-fb2a2.firebasestorage.app',
  messagingSenderId: '918535152924',
  appId:             '1:918535152924:web:e63edd2a28563dad5e86d9',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'New Order';
  const body  = payload.notification?.body  ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  });
});
