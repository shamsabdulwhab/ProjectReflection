import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

type Status = 'idle' | 'loading' | 'success'

export default function PhoneJoin() {
  const { sessionId } = useParams()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionId) return

    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      const started = snap.data()?.assessmentStarted === true
      if (started && status === 'success') {
        navigate(`/session/${sessionId}/join/feedback`)
      }
    })

    return unsub
  }, [sessionId, status, navigate])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!sessionId || !trimmedName) return

    setStatus('loading')
    try {
      await setDoc(doc(db, 'sessions', sessionId, 'participants', trimmedName), {
        name: trimmedName,
        joinedAt: serverTimestamp(),
      })
      sessionStorage.setItem(`participantName:${sessionId}`, trimmedName)
      setStatus('success')
    } catch  {
      setStatus('idle')
    }
  }

  return (
    <main>
      {!sessionId ? (
        <p>Invalid link: missing session id.</p>
      ) : (
        <>
          {status !== 'success' && (
            <form onSubmit={onSubmit}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Enter your name"
                disabled={status === 'loading'}
              />
              <button type="submit" disabled={status === 'loading' || name.trim().length === 0}>
                {status === 'loading' ? 'Joining…' : 'Join'}
              </button>
            </form>
          )}

          {status === 'success' && (
            <>
              <p>Waiting for others to join…</p>
              <p style={{ opacity: 0.75, marginTop: 8 }}>
                You’ll move to feedback when the host clicks “Start Assessment”.
              </p>
            </>
          )}
        </>
      )}
    </main>
  )
}