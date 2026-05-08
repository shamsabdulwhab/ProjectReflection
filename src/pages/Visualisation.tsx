import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import { db } from '../lib/firebase'

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

// --- Small pure functions (easy to test, easy to read) -----------------------

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

    const participantsCollection = collection(db, 'sessions', sessionId, 'participants')

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

    const scoresCollection = collection(db, 'sessions', sessionId, 'raterScores')

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
      <main>
        <p>Missing session id in the URL.</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Visualisation</h1>

      {RINGS_IN_ORDER.map((ringName) => {
        const peopleInThisRing = buckets[ringName]

        return (
          <section key={ringName}>
            <h2>{ringName}</h2>
            <ul>
              {peopleInThisRing.map((person) => (
                <li key={person.id}>{person.name}</li>
              ))}
            </ul>
          </section>
        )
      })}

      {pending.length > 0 ? (
        <section>
          <h2>No average yet</h2>
          <ul>
            {pending.map((person) => (
              <li key={person.id}>{person.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
