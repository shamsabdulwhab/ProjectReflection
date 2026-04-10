import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase' 

export default function PhoneJoin() {
  const { sessionId } = useParams()
  const [name, setName] = useState('')
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDoc(doc(db, 'sessions', sessionId, 'participants', name), {
      name: name,
      joinedAt: serverTimestamp(),
    })
  }
  return (
    <main>
      <form onSubmit={onSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} type="name" placeholder="Enter your name" />
        <button type="submit">Join</button>
      </form>
    </main>
  )
}