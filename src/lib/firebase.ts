import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const messaging = getMessaging(app)

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      vapidKey:           import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    return token || null
  } catch (err) {
    console.error('[FCM] requestNotificationPermission:', err)
    return null
  }
}

// Show browser notification when admin panel is open in foreground
export function listenForegroundMessages() {
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'New Order'
    const body  = payload.notification?.body  ?? ''
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' })
    }
  })
}
