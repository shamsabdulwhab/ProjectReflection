import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { getDb } from '../lib/firebase'
import { createNewHostSessionId, getOrCreateSessionId } from '../lib/sessionId'
import ReactQrCode from 'react-qr-code'
import './join.css'

export default function Join() {
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const [participants, setParticipants] = useState<Array<{ id: string; name: string }>>([])
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setDoc(
      doc(getDb(), 'sessions', sessionId),
      { createdAt: serverTimestamp(), assessmentStarted: false },
      { merge: true },
    )
  }, [sessionId])

  useEffect(() => {
    return onSnapshot(doc(getDb(), 'sessions', sessionId), (snap) => {
      setAssessmentStarted(snap.data()?.assessmentStarted === true)
      if (snap.data()?.showVisualisation === true) {
        navigate(`/session/${sessionId}/visualisation`)
      }
    })
  }, [sessionId, navigate])

  useEffect(() => {
    const ref = collection(getDb(), 'sessions', sessionId, 'participants')
    return onSnapshot(ref, (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as { name?: string; joinedAt?: Timestamp }
        const nameFromPhone = String(data.name ?? '').trim() || d.id
        const joinedMs = data.joinedAt instanceof Timestamp ? data.joinedAt.toMillis() : 0
        return { id: d.id, name: nameFromPhone, joinedMs }
      })
      rows.sort((a, b) => a.joinedMs - b.joinedMs || a.name.localeCompare(b.name))
      setParticipants(rows.map((r) => ({ id: r.id, name: r.name })))
    })
  }, [sessionId])

  const publicOrigin = (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined)?.replace(/\/$/, '')
  const joinUrl = `${publicOrigin ?? window.location.origin}/session/${sessionId}/join`
  const QRCode = (ReactQrCode as unknown as { default?: typeof ReactQrCode }).default ?? ReactQrCode

  function changeSession() {
    const id = createNewHostSessionId()
    setStartError(null)
    setAssessmentStarted(false)
    setParticipants([])
    setSessionId(id)
  }

  const hasEnoughParticipants = participants.length > 1
  const startButtonLabel = assessmentStarted
    ? 'Assessment started'
    : hasEnoughParticipants
      ? 'Start Assessment'
      : 'Waiting for participants to join'

  return (
    <main className="join-page">
      <section className="join-left">
        <div className="join-qr-frame">
          <QRCode value={joinUrl} size={220} />
        </div>
        <button type="button" className="join-change-session" onClick={changeSession}>
          Change session
        </button>
      </section>

      <aside className="join-right">
        <div className="join-participants-card">
          <div className="join-participants-header">Participants ({participants.length})</div>
          <ul className="join-participants-list">
            {participants.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <button
            type="button"
            className="join-start"
            disabled={assessmentStarted || !hasEnoughParticipants}
            onClick={async () => {
              setStartError(null)
              try {
                await setDoc(
                  doc(getDb(), 'sessions', sessionId),
                  { assessmentStarted: true, assessmentStartedAt: serverTimestamp() },
                  { merge: true },
                )
              } catch (e) {
                const message = e instanceof Error ? e.message : String(e)
                setStartError(message)
              }
            }}
          >
            {startButtonLabel}
          </button>
          {startError && <div className="join-error">Failed to start assessment: {startError}</div>}
        </div>
      </aside>
    </main>
  )
}
