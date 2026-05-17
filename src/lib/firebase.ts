import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

function env(key: string): string {
  const v = import.meta.env[key]
  if (!v || typeof v !== 'string') throw new Error(`Missing env ${key}`)
  return v
}

let app: FirebaseApp | undefined
let db: Firestore | undefined

/** Lazy init so the home page can load even if Firebase env is misconfigured. */
export function getDb(): Firestore {
  if (!db) {
    const firebaseConfig = {
      apiKey: env('VITE_FIREBASE_API_KEY'),
      authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: env('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: env('VITE_FIREBASE_APP_ID'),
    }
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  }
  return db
}
