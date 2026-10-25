import { useState } from 'react'
import { ListTodo, Calculator, LogOut } from 'lucide-react'
import LoginPage from './features/auth/LoginPage'
import TasksPage from './features/tasks/TasksPage'
import CalculatorPage from './features/calculator/CalculatorPage'
import { clearAccessToken } from './lib/api'

export default function App() {
  const [session, setSession] = useState(null)
  const [activePage, setActivePage] = useState('tasks')

  function handleLogin(data) {
    setSession(data)
    setActivePage('tasks')
  }

  function handleLogout() {
    clearAccessToken()
    setSession(null)
    setActivePage('tasks')
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
          <LogOut size={16} />
          خروج
        </button>
      </header>

      <nav className="service-navigation" aria-label="سرویس‌ها">
        <button
          type="button"
          className={activePage === 'tasks' ? 'is-active' : ''}
          onClick={() => setActivePage('tasks')}
        >
          <ListTodo size={18} />
          مدیریت تسک‌ها
        </button>

        <button
          type="button"
          className={activePage === 'calculator' ? 'is-active' : ''}
          onClick={() => setActivePage('calculator')}
        >
          <Calculator size={18} />
          ماشین‌حساب
        </button>
      </nav>

      {activePage === 'tasks' ? <TasksPage /> : <CalculatorPage />}
    </main>
  )
}
