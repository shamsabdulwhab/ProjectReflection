import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Join from './pages/Join'
import PhoneJoin from './pages/PhoneJoin'
import Feedback from './pages/feedback.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/session/:sessionId/join" element={<PhoneJoin />} />
      <Route path="/session/:sessionId/join/feedback" element={<Feedback />} />
    </Routes>
  )
}