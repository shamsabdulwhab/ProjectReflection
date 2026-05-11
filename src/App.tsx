import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Join from './pages/Join'
import PhoneJoin from './pages/PhoneJoin'
import Feedback from './pages/feedback.tsx'
import Visualisation from './pages/Visualisation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/session/:sessionId/join" element={<PhoneJoin />} />
      <Route path="/session/:sessionId/join/feedback" element={<Feedback />} />
      <Route path="/session/:sessionId/visualisation" element={<Visualisation />} />
      <Route path="/visualisation" element={<Navigate to="/join" replace />} />
    </Routes>
  )
}