import {useEffect} from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import EditableTitle from '../components/EditableTitle'
import ReactQrCode from 'react-qr-code'



export default function Join() {
  const sessionId = 'DEFAULT'
  useEffect(() => {
    // Create a new session document in the database ينشئ دوكيومنت جديد في القاعدة البيانية
    setDoc(doc(db, 'sessions', sessionId), {
    })
  }, [sessionId])
  const joinUrl = `${window.location.origin}/session/${sessionId}/join`
  const QRCode = (ReactQrCode as unknown as { default?: typeof ReactQrCode }).default ?? ReactQrCode

  return (
    <main>
      <EditableTitle />
      <div style={{ marginTop: 16, display: 'grid', placeItems: 'center' }}>
        <QRCode value={joinUrl} size={220} />
      </div>
    </main>
  )
}