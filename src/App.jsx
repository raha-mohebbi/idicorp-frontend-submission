import { useState } from 'react'
import LoginPage from './features/auth/LoginPage'
import TasksPage from './features/tasks/TasksPage'

export default function App() {
  const [session, setSession] = useState(null)

  function handleLogin(data) {
    setSession(data)
  }

  function handleLogout() {
    setSession(null)
    window.location.reload()
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <main className="console-shell">
      <header className="console-header">
        <div>
          <p className="eyebrow">IDICORP · SERVICE CONSOLE</p>
          <h1>پنل سرویس‌ها</h1>
        </div>

        <button
          type="button"
          className="submit-button"
          onClick={handleLogout}
        >
          خروج
        </button>
      </header>

      <TasksPage />
    </main>
  )
}
