import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'

const Join = lazy(() => import('./pages/Join'))
const PhoneJoin = lazy(() => import('./pages/PhoneJoin'))
const Feedback = lazy(() => import('./pages/feedback.tsx'))
const Visualisation = lazy(() => import('./pages/Visualisation'))

function PageFallback() {
  return (
    <div style={{ padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/session/:sessionId/join" element={<PhoneJoin />} />
        <Route path="/session/:sessionId/join/feedback" element={<Feedback />} />
        <Route path="/session/:sessionId/visualisation" element={<Visualisation />} />
        <Route path="/visualisation" element={<Navigate to="/join" replace />} />
      </Routes>
    </Suspense>
  )
}

