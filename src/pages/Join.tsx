import { useMemo, useState } from 'react'
import EditableTitle from '../components/EditableTitle'
import ReactQrCode from 'react-qr-code'
import { makeSessionId } from '../lib/sessions'

export default function Join() {
  const [sessionId] = useState(() => makeSessionId())
  const joinUrl = useMemo(
    () => `${window.location.origin}/session/${encodeURIComponent(sessionId)}/join`,
    [sessionId],
  )

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