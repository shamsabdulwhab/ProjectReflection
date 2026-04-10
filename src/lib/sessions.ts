import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase' // Import the Firebase Firestore database


export async function ensureSession(sessionId: string) {
  const ref = doc(db, 'sessions', sessionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {})
  }
  return ref
}

export function makeSessionId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

const JOIN_SESSION_STORAGE_KEY = 'reflection.joinSession.v1'

/** Same session id across refreshes so the QR stays in sync. */
export function getOrCreateJoinSessionId() {
  try {
    const saved = sessionStorage.getItem(JOIN_SESSION_STORAGE_KEY)
    if (saved && /^[A-Z2-9]{4}$/.test(saved)) return saved
  } catch {
    // ignore
  }
  const id = makeSessionId()
  try {
    sessionStorage.setItem(JOIN_SESSION_STORAGE_KEY, id)
  } catch {
    // ignore
  }
  return id
}
