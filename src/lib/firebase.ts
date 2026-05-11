import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

//this function is used to get the environment variable.
function env(key: string) {
  const v = import.meta.env[key]
  if (!v || typeof v !== 'string') throw new Error(`Missing env ${key}`)
  return v
}
//the Firebase configuration is defined using environment variables. its store in env
//  This is a secure way to store Firebase configuration without hardcoding it in the code.
const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
}
//the Firebase app is initialized and Firestore is exported as db.
export const firebaseApp = initializeApp(firebaseConfig)
//db here is just a variable name, it could be called anything.
//I used db as the shared database connection across the project.
//  This means every page that needs Firestore can import the same database
//  instance instead of creating a new one.
export const db = getFirestore(firebaseApp)
// db will be used as {db} in the code.