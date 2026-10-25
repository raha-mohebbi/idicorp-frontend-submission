import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ListTodo,
  Plus,
  X,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";

const initialForm = {
  title: "",
  description: "",
  completed: false,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    completed: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function fetchTasks() {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) {
        params.q = search.trim();
      }

      if (status !== "all") {
        params.completed = status === "completed";
      }

      const { data } = await api.get("/api/tasks", { params });
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (search.trim()) {
          params.q = search.trim();
        }

        if (status !== "all") {
          params.completed = status === "completed";
        }

        const { data } = await api.get("/api/tasks", { params });

        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [search, status]);

  function handleFormChange(event) {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setFormError("عنوان تسک الزامی است.");
      return;
    }

    if (title.length > 120) {
      setFormError("عنوان تسک نباید بیشتر از ۱۲۰ کاراکتر باشد.");
      return;
    }

    if (description.length > 2000) {
      setFormError("توضیحات نباید بیشتر از ۲۰۰۰ کاراکتر باشد.");
      return;
    }

    setCreating(true);

    try {
      const { data: createdTask } = await api.post("/api/tasks", {
        title,
        description,
        completed: form.completed,
      });

      setTasks((current) => [createdTask, ...current]);
      setForm(initialForm);
      setShowForm(false);
      setSuccess("تسک با موفقیت ایجاد شد.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEditing(task) {
    setEditingId(task.id);
    setEditForm({
      title: task.title ?? "",
      description: task.description ?? "",
      completed: Boolean(task.completed),
    });
    setActionError("");
    setSuccess("");
  }

  function handleEditChange(event) {
    const { name, value, checked, type } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUpdateTask(event) {
    event.preventDefault();
    setActionError("");

    const title = editForm.title.trim();
    const description = editForm.description.trim();

    if (!title) {
      setActionError("عنوان تسک الزامی است.");
      return;
    }

    if (title.length > 120 || description.length > 2000) {
      setActionError("عنوان حداکثر ۱۲۰ و توضیحات حداکثر ۲۰۰۰ کاراکتر است.");
      return;
    }

    setSavingEdit(true);

    try {
      const { data: updatedTask } = await api.patch(`/api/tasks/${editingId}`, {
        title,
        description,
        completed: editForm.completed,
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === editingId ? { ...task, ...updatedTask } : task,
        ),
      );

      setEditingId(null);
      setSuccess("تسک با موفقیت ویرایش شد.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(`از حذف تسک «${task.title}» مطمئنی؟`);

    if (!confirmed) return;

    setActionError("");
    setSuccess("");
    setDeletingId(task.id);

    try {
      await api.delete(`/api/tasks/${task.id}`);

      setTasks((current) => current.filter((item) => item.id !== task.id));

      if (editingId === task.id) {
        setEditingId(null);
      }

      setSuccess("تسک با موفقیت حذف شد.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">SERVICE CONSOLE</p>
          <h1>مدیریت تسک‌ها</h1>
          <p className="tasks-description">
            تسک‌ها را مشاهده، جست‌وجو و مدیریت کن.
          </p>
        </div>

        <div className="tasks-header-actions">
          <button
            type="button"
            className="tasks-refresh"
            onClick={fetchTasks}
            disabled={loading}
          >
            <RefreshCw size={16} />
            بروزرسانی
          </button>

          <button
            type="button"
            className="tasks-create-button"
            onClick={() => {
              setShowForm((current) => !current);
              setFormError("");
              setSuccess("");
            }}
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "بستن فرم" : "تسک جدید"}
          </button>
        </div>
      </header>

      {success && (
        <div className="tasks-success" role="status">
          {success}
        </div>
      )}
      {actionError && (
        <div className="tasks-error" role="alert">
          <p>{actionError}</p>
        </div>
      )}
      {showForm && (
        <form className="task-form" onSubmit={handleCreateTask}>
          <h2>ایجاد تسک جدید</h2>

          <label className="task-form-field">
            <span>عنوان تسک *</span>
            <input
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="مثلاً بررسی گزارش‌ها"
              maxLength={120}
              required
              autoFocus
            />
            <small>{form.title.length}/120</small>
          </label>

          <label className="task-form-field">
            <span>توضیحات</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="توضیحات تسک را وارد کن..."
              maxLength={2000}
              rows={4}
            />
            <small>{form.description.length}/2000</small>
          </label>

          <label className="task-form-checkbox">
            <input
              type="checkbox"
              name="completed"
              checked={form.completed}
              onChange={handleFormChange}
            />
            این تسک تکمیل شده است
          </label>

          {formError && (
            <p className="tasks-error-message" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="tasks-create-button"
            disabled={creating}
          >
            <Plus size={17} />
            {creating ? "در حال ایجاد..." : "ایجاد تسک"}
          </button>
        </form>
      )}

      <div className="tasks-toolbar">
        <label className="tasks-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجوی تسک..."
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
          <button type="button" onClick={fetchTasks}>
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
              {editingId === task.id ? (
                <form className="task-edit-form" onSubmit={handleUpdateTask}>
                  <label className="task-form-field">
                    <span>عنوان تسک</span>
                    <input
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      maxLength={120}
                      required
                      autoFocus
                    />
                  </label>

                  <label className="task-form-field">
                    <span>توضیحات</span>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      maxLength={2000}
                      rows={3}
                    />
                  </label>

                  <label className="task-form-checkbox">
                    <input
                      type="checkbox"
                      name="completed"
                      checked={editForm.completed}
                      onChange={handleEditChange}
                    />
                    تکمیل شده
                  </label>

                  <div className="task-actions">
                    <button
                      type="submit"
                      className="task-action-button"
                      disabled={savingEdit}
                    >
                      <Save size={16} />
                      {savingEdit ? "در حال ذخیره..." : "ذخیره"}
                    </button>

                    <button
                      type="button"
                      className="task-action-button"
                      onClick={() => {
                        setEditingId(null);
                        setActionError("");
                      }}
                      disabled={savingEdit}
                    >
                      <X size={16} />
                      انصراف
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="task-card-content">
                    <h2>{task.title}</h2>
                    {task.description && <p>{task.description}</p>}

                    <label className="task-card-checkbox">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        onChange={async () => {
                          setActionError("");
                          setSuccess("");

                          try {
                            const { data: updatedTask } = await api.patch(
                              `/api/tasks/${task.id}`,
                              { completed: !task.completed },
                            );

                            setTasks((current) =>
                              current.map((item) =>
                                item.id === task.id
                                  ? { ...item, ...updatedTask }
                                  : item,
                              ),
                            );

                            setSuccess("وضعیت تسک به‌روزرسانی شد.");
                          } catch (err) {
                            setActionError(getErrorMessage(err));
                          }
                        }}
                        aria-label={`تغییر وضعیت ${task.title}`}
                      />
                      <span>
                        {task.completed ? "تکمیل‌شده" : "در حال انجام"}
                      </span>
                    </label>
                  </div>

                  <div className="task-card-actions">
                    <span
                      className={`task-status ${
                        task.completed ? "is-completed" : "is-pending"
                      }`}
                    >
                      {task.completed ? "تکمیل‌شده" : "در حال انجام"}
                    </span>

                    <button
                      type="button"
                      className="task-icon-button"
                      onClick={() => startEditing(task)}
                      aria-label={`ویرایش ${task.title}`}
                      title="ویرایش"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="task-icon-button task-delete-button"
                      onClick={() => handleDeleteTask(task)}
                      disabled={deletingId === task.id}
                      aria-label={`حذف ${task.title}`}
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}

          {actionError && (
            <div className="tasks-error" role="alert">
              <p>{actionError}</p>
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <p className="tasks-count">
          تعداد تسک‌های نمایش‌داده‌شده: {tasks.length}
        </p>
      )}
    </section>
  );
}
