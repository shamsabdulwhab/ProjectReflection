import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import { getDb } from '../lib/firebase'
import './visualisation.css'

// --- Types (what shape our data has) ----------------------------------------

type Participant = {
  id: string
  name: string
}

// One row per person: we still compute average to pick a ring, but we only show the name on screen
type PersonWithAverage = {
  id: string
  name: string
  average: number | null
}

// The five “rings” from centre (best scores) to outside (lowest scores)
type RingName = 'Core' | 'Close' | 'Immediate' | 'Far' | 'Distant'

// Fixed order we print sections in (inside → outside idea)
const RINGS_IN_ORDER: RingName[] = ['Core', 'Close', 'Immediate', 'Far', 'Distant']

const DIAGRAM_CX = 500
const DIAGRAM_CY = 500
/** Nudge labels left from the ring line (negative = left). */
const RING_LABEL_OFFSET_X = -50
/** Outer radius of each ring band (Core → Distant), in SVG units. */
const RING_OUTER_RADIUS: Record<RingName, number> = {
  Core: 100,
  Close: 200,
  Immediate: 300,
  Far: 400,
  Distant: 480,
}

// --- Small pure functions (easy to test, easy to read) -----------------------

function ringIndex(ring: RingName): number {
  return RINGS_IN_ORDER.indexOf(ring)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function personColor(id: string): string {
  const palette = ['#f9d56e', '#7ec8e3', '#8fd694', '#f48fb1', '#b39ddb', '#ffab91']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

/** Stable angle jitter so positions do not jump on re-render. */
function angleJitter(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) | 0
  return ((hash % 50) - 25) * (Math.PI / 180)
}

/** Place a person in the middle of their ring band at an even angle around the circle. */
function placeInRing(
  ring: RingName,
  indexInRing: number,
  countInRing: number,
  personId: string,
): { x: number; y: number } {
  const idx = ringIndex(ring)
  const outer = RING_OUTER_RADIUS[ring]
  const inner = idx === 0 ? 0 : RING_OUTER_RADIUS[RINGS_IN_ORDER[idx - 1]]
  const midRadius = (inner + outer) / 2
  const baseAngle = countInRing <= 1 ? -Math.PI / 2 : (2 * Math.PI * indexInRing) / countInRing - Math.PI / 2
  const angle = baseAngle + angleJitter(personId)
  return {
    x: DIAGRAM_CX + midRadius * Math.cos(angle),
    y: DIAGRAM_CY + midRadius * Math.sin(angle),
  }
}

/**
 * Turn one average (0–100) into a ring name.
 * Higher number = closer to the middle (Core).
 */
function averageToRingName(average: number): RingName {
  if (average >= 80) return 'Core'
  if (average >= 60) return 'Close'
  if (average >= 40) return 'Immediate'
  if (average >= 20) return 'Far'
  return 'Distant'
}

/**
 * raterScoresByRater = for each person who voted, a map of “who they scored” → score.
 * We want: for each participant, the average of all scores people gave them.
 */
function computeAveragePerPerson(
  participants: Participant[],
  raterScoresByRater: { [raterId: string]: { [participantId: string]: number } },
): PersonWithAverage[] {
  // Step 1: add up all scores each participant received, and count how many scores that was
  const totalScoreByPerson: { [participantId: string]: number } = {}
  const countByPerson: { [participantId: string]: number } = {}

  const raterIds = Object.keys(raterScoresByRater)
  for (let i = 0; i < raterIds.length; i++) {
    const raterId = raterIds[i]
    const scoresThisRaterGave = raterScoresByRater[raterId]
    const ratedPersonIds = Object.keys(scoresThisRaterGave)

    for (let j = 0; j < ratedPersonIds.length; j++) {
      const participantId = ratedPersonIds[j]
      const score = scoresThisRaterGave[participantId]

      if (typeof score !== 'number') continue
      if (Number.isNaN(score)) continue

      if (totalScoreByPerson[participantId] === undefined) {
        totalScoreByPerson[participantId] = 0
        countByPerson[participantId] = 0
      }
      totalScoreByPerson[participantId] += score
      countByPerson[participantId] += 1
    }
  }

  // Step 2: build one row per participant (same order as the participants list)
  const result: PersonWithAverage[] = []
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i]
    const count = countByPerson[p.id]
    const total = totalScoreByPerson[p.id]

    let average: number | null = null
    if (count !== undefined && count > 0 && total !== undefined) {
      average = total / count
    }

    result.push({
      id: p.id,
      name: p.name,
      average,
    })
  }

  return result
}

/**
 * Put each person into either a ring bucket, or “pending” if they have no average yet.
 */
function groupPeopleByRing(people: PersonWithAverage[]) {
  const emptyBuckets: { [K in RingName]: PersonWithAverage[] } = {
    Core: [],
    Close: [],
    Immediate: [],
    Far: [],
    Distant: [],
  }
  const pending: PersonWithAverage[] = []

  for (let i = 0; i < people.length; i++) {
    const person = people[i]

    if (person.average === null) {
      pending.push(person)
      continue
    }

    const ring = averageToRingName(person.average)
    emptyBuckets[ring].push(person)
  }

  return { buckets: emptyBuckets, pending }
}

// --- React component ----------------------------------------------------------

export default function Visualisation() {
  // sessionId comes from the URL, e.g. /session/DEFAULT/visualisation → "DEFAULT"
  const { sessionId } = useParams<{ sessionId: string }>()

  // Everyone who joined this session (from Firestore)
  const [participants, setParticipants] = useState<Participant[]>([])

  // Each key = one person who submitted scores; value = map of participantId → score (0–100)
  const [raterScoresByRater, setRaterScoresByRater] = useState<{
    [raterId: string]: { [participantId: string]: number }
  }>({})

  // Listen to Firestore: whenever the participants list changes, update React state
  useEffect(() => {
    if (!sessionId) {
      return
    }

    const participantsCollection = collection(getDb(), 'sessions', sessionId, 'participants')

    const unsubscribe = onSnapshot(participantsCollection, (snapshot) => {
      const list: Participant[] = []

      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i]
        const data = docSnap.data() as { name?: string }
        const nameFromDb = data.name
        const safeName =
          typeof nameFromDb === 'string' && nameFromDb.trim().length > 0 ? nameFromDb.trim() : docSnap.id

        list.push({ id: docSnap.id, name: safeName })
      }

      setParticipants(list)
    })

    return unsubscribe
  }, [sessionId])

  // Listen to Firestore: all saved slider results from the feedback screen
  useEffect(() => {
    if (!sessionId) {
      return
    }

    const scoresCollection = collection(getDb(), 'sessions', sessionId, 'raterScores')

    const unsubscribe = onSnapshot(scoresCollection, (snapshot) => {
      const next: { [raterId: string]: { [participantId: string]: number } } = {}

      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i]
        const data = docSnap.data() as { scores?: { [key: string]: unknown } }
        const rawScores = data.scores ?? {}

        const cleanedScores: { [participantId: string]: number } = {}
        const keys = Object.keys(rawScores)
        for (let j = 0; j < keys.length; j++) {
          const participantId = keys[j]
          const value = rawScores[participantId]
          if (typeof value === 'number' && !Number.isNaN(value)) {
            cleanedScores[participantId] = value
          }
        }

        next[docSnap.id] = cleanedScores
      }

      setRaterScoresByRater(next)
    })

    return unsubscribe
  }, [sessionId])

  // Normal JavaScript (runs every render): turn Firestore data into groups to show
  const peopleWithAverages = computeAveragePerPerson(participants, raterScoresByRater)
  const { buckets, pending } = groupPeopleByRing(peopleWithAverages)

  if (!sessionId) {
    return (
      <main className="visualisation-page">
        <p>Missing session id in the URL.</p>
      </main>
    )
  }

  return (
    <main className="visualisation-page">
      <div className="viz-decor viz-decor--top-right" aria-hidden />
      <div className="viz-decor viz-decor--bottom-left" aria-hidden />

      <div className="viz-layout">
        <svg
          className="viz-svg"
          viewBox="0 0 1000 1000"
          role="img"
          aria-label="Concentric rings showing how close each participant is rated"
        >
          {RINGS_IN_ORDER.map((ringName) => (
            <circle
              key={ringName}
              className="viz-ring"
              cx={DIAGRAM_CX}
              cy={DIAGRAM_CY}
              r={RING_OUTER_RADIUS[ringName]}
            />
          ))}

          {RINGS_IN_ORDER.map((ringName) => (
            <text
              key={`label-${ringName}`}
              className="viz-ring-label"
              x={DIAGRAM_CX + RING_OUTER_RADIUS[ringName] + RING_LABEL_OFFSET_X}
              y={DIAGRAM_CY}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {ringName}
            </text>
          ))}

          {RINGS_IN_ORDER.flatMap((ringName) => {
            const peopleInRing = buckets[ringName]
            return peopleInRing.map((person, index) => {
              const { x, y } = placeInRing(ringName, index, peopleInRing.length, person.id)
              return (
                <g key={person.id} transform={`translate(${x}, ${y})`}>
                  <title>{person.name}</title>
                  <circle className="viz-avatar" r={26} fill={personColor(person.id)} />
                  <text className="viz-avatar-initials" textAnchor="middle" dominantBaseline="central">
                    {initials(person.name)}
                  </text>
                </g>
              )
            })
          })}
        </svg>

        {pending.length > 0 ? (
          <div className="viz-pending">
            <p>Waiting for scores</p>
            <ul>
              {pending.map((person) => (
                <li key={person.id}>{person.name}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  )
}
