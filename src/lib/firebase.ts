import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

function env(key: string) {
  const v = import.meta.env[key]
  if (!v || typeof v !== 'string') throw new Error(`Missing env ${key}`)
  return v
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
}

export const firebaseApp = initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)