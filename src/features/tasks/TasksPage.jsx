
import { useEffect, useState } from 'react'
import { Search, RefreshCw, ListTodo } from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchTasks() {
      setLoading(true)
      setError('')

      try {
        const params = {}

        if (search.trim()) {
          params.q = search.trim()
        }

        if (status !== 'all') {
          params.completed = status === 'completed'
        }

        const { data } = await api.get('/api/tasks', { params })

        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchTasks()

    return () => {
      cancelled = true
    }
  }, [search, status])

  async function refreshTasks() {
    setLoading(true)
    setError('')

    try {
      const params = {}

      if (search.trim()) {
        params.q = search.trim()
      }

      if (status !== 'all') {
        params.completed = status === 'completed'
      }

      const { data } = await api.get('/api/tasks', { params })
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">SERVICE CONSOLE</p>
          <h1>مدیریت تسک‌ها</h1>
          <p className="tasks-description">
            تسک‌ها را مشاهده و بر اساس عنوان یا وضعیت فیلتر کن.
          </p>
        </div>

        <button
          type="button"
          className="tasks-refresh"
          onClick={refreshTasks}
          disabled={loading}
        >
          <RefreshCw size={16} />
          بروزرسانی
        </button>
      </header>

      <div className="tasks-toolbar">
        <label className="tasks-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی تسک"
            aria-label="جست‌وجوی تسک"
          />
        </label>

        <label className="tasks-filter">
          <span>وضعیت:</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">همه</option>
            <option value="completed">تکمیل‌شده</option>
            <option value="incomplete">در حال انجام</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="tasks-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={refreshTasks}>
            تلاش مجدد
          </button>
        </div>
      )}

      {loading ? (
        <div className="tasks-state" role="status">
          در حال دریافت تسک‌ها...
        </div>
      ) : error ? null : tasks.length === 0 ? (
        <div className="tasks-state">
          <ListTodo size={32} />
          <h2>تسکی پیدا نشد</h2>
          <p>عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-content">
                <h2>{task.title}</h2>
                {task.description && <p>{task.description}</p>}
              </div>

              <span
                className={`task-status ${
                  task.completed ? 'is-completed' : 'is-pending'
                }`}
              >
                {task.completed ? 'تکمیل‌شده' : 'در حال انجام'}
              </span>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="tasks-count">
          تعداد تسک‌های نمایش‌داده‌شده: {tasks.length}
        </p>
      )}
    </section>
  )
}
