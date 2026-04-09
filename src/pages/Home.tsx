import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main style={styles.page}>
      <section style={styles.content}>
        <h1 style={styles.title}>Group Reflection</h1>
        <p style={styles.subtitle}>Understand how others see you</p>
        <Link to="/join" className="secondaryBtn">
          Start the session
        </Link>
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    textAlign: 'center',
  },
  content: { display: 'grid', gap: 12, justifyItems: 'center' },
  title: { margin: 0, fontSize: 44, letterSpacing: -0.6 },
  subtitle: { margin: 0, opacity: 0.75 },
}
