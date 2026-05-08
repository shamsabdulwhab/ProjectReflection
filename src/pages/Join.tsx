import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import EditableTitle from '../components/EditableTitle'
import ReactQrCode from 'react-qr-code'

export default function Join() {
  const sessionId = 'DEFAULT'
  const [participants, setParticipants] = useState<Array<{ id: string; name: string }>>([])
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  useEffect(() => {
    // Create a new session document in the database ينشئ دوكيومنت جديد في القاعدة البيانية
    setDoc(doc(db, 'sessions', sessionId), {}, { merge: true })
  }, [sessionId])

  useEffect(() => {
    return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      setAssessmentStarted(snap.data()?.assessmentStarted === true)
    })
  }, [sessionId])

  useEffect(() => {
    const ref = collection(db, 'sessions', sessionId, 'participants')

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

  //  so allow overriding the QR origin.
  const publicOrigin = (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined)?.replace(/\/$/, '')
  const joinUrl = `${publicOrigin ?? window.location.origin}/session/${sessionId}/join`
  const QRCode = (ReactQrCode as unknown as { default?: typeof ReactQrCode }).default ?? ReactQrCode

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>
      <section>
        <EditableTitle />
        <div style={{ marginTop: 16, display: 'grid', placeItems: 'center' }}>
          <QRCode value={joinUrl} size={220} />
        </div>
        <button
          type="button"
          disabled={assessmentStarted}
          onClick={async () => {
            setStartError(null)
            try {
              await setDoc(
                doc(db, 'sessions', sessionId),
                { assessmentStarted: true, assessmentStartedAt: serverTimestamp() },
                { merge: true },
              )
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e)
              setStartError(message)
            }
          }}
        >
          {assessmentStarted ? 'Assessment started' : 'Start Assessment'}
        </button>
        {startError && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#b00020' }}>
            Failed to start assessment: {startError}
          </div>
        )}
      </section>

      <aside style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Participants ({participants.length})</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {participants.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </aside>
    </main>
  )
}