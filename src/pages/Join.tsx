import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import EditableTitle from '../components/EditableTitle'
import ReactQrCode from 'react-qr-code'



export default function Join() {
  const sessionId = 'DEFAULT'
  const [participants, setParticipants] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    // Create a new session document in the database ينشئ دوكيومنت جديد في القاعدة البيانية
    setDoc(doc(db, 'sessions', sessionId), {}, { merge: true })
  }, [sessionId])

  useEffect(() => {
    const ref = collection(db, 'sessions', sessionId, 'participants')
    const q = query(ref, orderBy('joinedAt', 'asc'))

    return onSnapshot(q, (snap) => {
      setParticipants(
        snap.docs.map((d) => {
          const data = d.data() as { name?: string }
          return { id: d.id, name: data.name ?? d.id }
        }),
      )
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
        onClick={async () => {
            await setDoc(
         doc(db, 'sessions', sessionId),
      { assessmentStarted: true, assessmentStartedAt: serverTimestamp() },
      { merge: true },
    )
  }}
>
  Start Assessment
</button>
        
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