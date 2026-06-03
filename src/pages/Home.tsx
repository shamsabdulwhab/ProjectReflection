import { Link } from 'react-router-dom'
import EditableTitle from '../components/EditableTitle'
import './home.css'

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-content">
        <h1 className="home-title"> Reflection</h1>
        <p className="home-subtitle">How others see you</p>
        <EditableTitle className="home-editable-title" />
        <Link to="/join" className="home-start-link">
          Start the session
        </Link>
      </section>
    </main>
  )
}
