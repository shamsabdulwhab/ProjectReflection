/**
 * Feedback page — route: /session/:sessionId/join/feedback
 *
 * After the host starts the assessment, each participant rates *others* with sliders (0–100).
 * Scores live in React state (`scores`) and are synced to Firestore so the visualisation page
 * can read averages. Doc path: sessions/{sessionId}/raterScores/{myName}
 *
 * `myName` must match PhoneJoin (sessionStorage key participantName:{sessionId}).
 */
import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import Slider from '../components/slider'

type Participant = { id: string; name: string }

export default function Feedback() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [participants, setParticipants] = useState<Participant[]>([])
  // Slider value per participant id (percentage). Keys are added when the participants list loads.
  const [scores, setScores] = useState<Record<string, number>>({})
  const [assessmentStarted, setAssessmentStarted] = useState<boolean>(false)

  // Same id string PhoneJoin stored when this user joined (used as Firestore doc id for raterScores).
  const myName = useMemo(() => {
    if (!sessionId) return null
    return sessionStorage.getItem(`participantName:${sessionId}`)
  }, [sessionId])

  // Live: host toggles "Start Assessment" on the session document.
  useEffect(() => {
    if (!sessionId) return

    return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      setAssessmentStarted(snap.data()?.assessmentStarted === true)
    })
  }, [sessionId])

  // Live: everyone in this session (we merge new people into `scores` with default 50).
  useEffect(() => {
    if (!sessionId) return

    const ref = collection(db, 'sessions', sessionId, 'participants')
    const q = query(ref, orderBy('name'))

    return onSnapshot(q, (snapshot) => {
      const list: Participant[] = snapshot.docs.map((d) => {
        const data = d.data() as { name?: string }
        return { id: d.id, name: data.name ?? d.id }
      })

      setParticipants(list)

      setScores((prev) => {
        const next = { ...prev }
        for (const p of list) {
          if (next[p.id] === undefined) next[p.id] = 50
        }
        return next
      })
    })
  }, [sessionId])

  // Debounced write: when sliders change, save this user’s ratings map to Firestore (visualisation reads it).
  useEffect(() => {
    if (!sessionId || !myName || !assessmentStarted) return

    const handle = window.setTimeout(() => {
      void setDoc(
        doc(db, 'sessions', sessionId, 'raterScores', myName),
        { scores, updatedAt: serverTimestamp() },
        { merge: true },
      )
    }, 400)

    return () => window.clearTimeout(handle)
  }, [sessionId, myName, assessmentStarted, scores])

  // You don’t rate yourself — only other participants get a row + slider.
  const visibleParticipants = useMemo(() => {
    if (!myName) return participants
    return participants.filter((p) => p.id !== myName)
  }, [participants, myName])

  // Router should always provide sessionId; defensive guard.
  if (!sessionId) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ opacity: 0.7 }}>Invalid link: missing session id.</p>
      </main>
    )
  }

  // No name in sessionStorage → user skipped PhoneJoin on this browser.
  if (!myName) {
    return (
      <main style={{ padding: 16 }}>
        <p style={{ opacity: 0.7 }}>
          You haven’t joined this session on this device yet. Please open the join link and enter your name first.
        </p>
      </main>
    )
  }

  // Gate until host sets assessmentStarted on the session doc.
  if (!assessmentStarted) {
    return (
      <main style={{ padding: 16, display: 'grid', gap: 8, maxWidth: 720 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Waiting for the host to start the assessment…</p>
        <p style={{ margin: 0, opacity: 0.75 }}>
          You can’t access feedback until the host clicks “Start Assessment” on the big screen.
        </p>
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={() => navigate(`/session/${sessionId}/join`)}>
            Back to join screen
          </button>
        </div>
      </main>
    )
  }

  // Main UI: one slider per other participant; updating state triggers the debounced Firestore sync above.
  return (
    <main style={{ padding: 16, display: 'grid', gap: 12 }}>
      {visibleParticipants.map((p) => {
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

            <Slider value={value} onChange={(v) => setScores((prev) => ({ ...prev, [p.id]: v }))} />

            <div style={{ textAlign: 'right' }}>{value} %</div>
          </div>
        )
      })}

      {visibleParticipants.length > 0 && (
        <p style={{ margin: 0, marginTop: 8 }}>
          <Link to={`/session/${sessionId}/visualisation`}>Open visualisation</Link>
        </p>
      )}
    </main>
  )
}