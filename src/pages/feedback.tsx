import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Slider from '../components/slider'

type Participant = { id: string; name: string }

export default function Feedback() {
  const sessionId = 'DEFAULT'
  const [participants, setParticipants] = useState<Participant[]>([])

  // slider value per participant id
  const [scores, setScores] = useState<Record<string, number>>({})

  useEffect(() => {
    const ref = collection(db, 'sessions', sessionId, 'participants')
    const q = query(ref, orderBy('name'))

    return onSnapshot(q, (snapshot) => {
      const list: Participant[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name?: string }).name ?? d.id,
      }))

      setParticipants(list)

      // Ensure each participant has a default score.
      setScores((prev) => {
        const next = { ...prev }
        for (const p of list) {
          if (next[p.id] === undefined) next[p.id] = 50
        }
        return next
      })
    })
  }, [sessionId])

  return (
    <main style={{ padding: 16, display: 'grid', gap: 12 }}>
      {participants.map((p) => {
        const value = scores[p.id] ?? 50

        return (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 48px',
              alignItems: 'center',
              gap: 12,
              maxWidth: 720,
            }}
          >
            <div style={{ fontWeight: 600 }}>{p.name}</div>

            <Slider
              value={value}
              onChange={(v) => setScores((prev) => ({ ...prev, [p.id]: v }))}
            />

            <div style={{ textAlign: 'right' }}>{value} %</div>
          </div>
        )
      })}

      {participants.length === 0 && <p style={{ opacity: 0.7 }}>No participants yet.</p>}
    </main>
  )
}