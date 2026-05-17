/** sessionStorage key for the host's active session (Join / QR page). */
const HOST_SESSION_KEY = 'hostSessionId'

/** Creates a short random id (10 chars). Prefers crypto.randomUUID when available. */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  }
  return Math.random().toString(36).slice(2, 12)
}

/** Returns the stored host session id, or generates and persists a new one. */
export function getOrCreateSessionId(): string {
  const saved = sessionStorage.getItem(HOST_SESSION_KEY)
  if (saved) return saved
  return createNewHostSessionId()
}

/** Generates a new host session id, saves it, and returns it (e.g. "Change session"). */
export function createNewHostSessionId(): string {
  const id = generateSessionId()
  sessionStorage.setItem(HOST_SESSION_KEY, id)
  return id
}
