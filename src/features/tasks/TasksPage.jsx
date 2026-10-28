
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
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  LoaderCircle,
  ClipboardList,
  Filter,
} from "lucide-react";
import { useTaskStore } from "../../store/useTaskStore";

function formatTaskDate(dateString) {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return null;
  }
}

const initialForm = {
  title: "",
  description: "",
  completed: false,
};

export default function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const isLoading = useTaskStore((state) => state.isLoading);
  const isCreating = useTaskStore((state) => state.isCreating);
  const savingEditId = useTaskStore((state) => state.savingEditId);
  const updatingId = useTaskStore((state) => state.updatingId);
  const deletingId = useTaskStore((state) => state.deletingId);
  const error = useTaskStore((state) => state.error);
  const success = useTaskStore((state) => state.successMessage);

  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const clearMessages = useTaskStore((state) => state.clearMessages);

  // Aliases for JSX compatibility
  const loading = isLoading;
  const creating = isCreating;
  const savingEdit = savingEditId !== null;
  const search = searchQuery;
  const status = statusFilter;
  const setSearch = setSearchQuery;
  const setStatus = setStatusFilter;

  // Local form & modal state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [actionError, setActionError] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [searchQuery, statusFilter, fetchTasks]);

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
    setActionError("");
    clearMessages();

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

    const ok = await createTask({
      title,
      description,
      completed: form.completed,
    });

    if (ok) {
      setForm(initialForm);
      setShowForm(false);
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
    clearMessages();
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
    clearMessages();

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

    const ok = await updateTask(editingId, {
      title,
      description,
      completed: editForm.completed,
    });

    if (ok) {
      setEditingId(null);
    }
  }

  function promptDeleteTask(task) {
    setTaskToDelete(task);
    setActionError("");
    clearMessages();
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) return;
    const task = taskToDelete;
    setTaskToDelete(null);

    setActionError("");
    clearMessages();

    const ok = await deleteTask(task.id);
    if (ok && editingId === task.id) {
      setEditingId(null);
    }
  }

  async function handleToggleTask(task) {
    if (updatingId !== null) return;
    setActionError("");
    clearMessages();
    await toggleTaskCompletion(task);
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F5F6FA] px-4 py-6 text-[#1D2238] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl bg-[#1D2238] p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
          <div className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-[#E20912]/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#E20912]" />
                SERVICE CONSOLE
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  مدیریت تسک‌ها
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  تسک‌ها را ایجاد کن، وضعیت آن‌ها را پیگیری کن و فعالیت‌هایت
                  را در یک محیط متمرکز مدیریت کن.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchTasks}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                بروزرسانی
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm((current) => !current);
                  setFormError("");
                  clearMessages();
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E20912] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C80710] focus:outline-none focus:ring-4 focus:ring-[#E20912]/30"
              >
                {showForm ? <X size={17} /> : <Plus size={17} />}
                {showForm ? "بستن فرم" : "تسک جدید"}
              </button>
            </div>
          </div>
        </header>

        {/* Notifications */}
        {success && (
          <div
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-800"
            role="status"
          >
            <CircleCheck size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
            <button
              type="button"
              onClick={clearMessages}
              className="mr-auto rounded-lg p-1 transition hover:bg-emerald-100"
              aria-label="بستن پیام"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {actionError && (
          <div
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800"
            role="alert"
          >
            <CircleAlert size={19} className="mt-0.5 shrink-0" />
            <p>{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="mr-auto rounded-lg p-1 transition hover:bg-red-100"
              aria-label="بستن پیام خطا"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D2238]/[0.06] text-[#1D2238]">
              <ClipboardList size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">تسک‌های نمایش‌داده‌شده</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {tasks.length.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Check size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">تکمیل‌شده</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {completedCount.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">در حال انجام</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {pendingCount.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>
        </section>

        {/* Create form */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E20912]/[0.07] text-[#E20912]">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="font-bold">ایجاد تسک جدید</h2>
                <p className="mt-1 text-xs text-slate-500">
                  اطلاعات تسک جدید را وارد کن.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5 p-5 sm:p-7">
              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>عنوان تسک <span className="text-[#E20912]">*</span></span>
                  <span className="text-xs font-normal text-slate-400">
                    {form.title.length}/120
                  </span>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="مثلاً بررسی گزارش‌ها"
                  maxLength={120}
                  required
                  autoFocus
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1D2238] focus:bg-white focus:ring-4 focus:ring-[#1D2238]/[0.06]"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>توضیحات</span>
                  <span className="text-xs font-normal text-slate-400">
                    {form.description.length}/2000
                  </span>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="توضیحات تکمیلی تسک را وارد کن..."
                  maxLength={2000}
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-[#1D2238] focus:bg-white focus:ring-4 focus:ring-[#1D2238]/[0.06]"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="completed"
                  checked={form.completed}
                  onChange={handleFormChange}
                  className="h-4 w-4 accent-[#E20912]"
                />
                این تسک تکمیل شده است
              </label>

              {formError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E20912] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C80710] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  {creating ? "در حال ایجاد..." : "ایجاد تسک"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  disabled={creating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={16} />
                  انصراف
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Search and filters */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#1D2238]">
            <Filter size={17} />
            جست‌وجو و فیلتر
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <label htmlFor="taskSearch" className="relative block flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="taskSearch"
                name="taskSearch"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجو بر اساس عنوان یا توضیحات..."
                aria-label="جست‌وجوی تسک"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#FCFBFF] py-3 pr-11 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1D2238] focus:bg-white focus:ring-4 focus:ring-[#1D2238]/[0.06]"
              />
            </label>

            <label htmlFor="taskStatusFilter" className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 md:w-64">
              <span className="shrink-0 text-sm text-slate-500">وضعیت:</span>
              <select
                id="taskStatusFilter"
                name="taskStatusFilter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="min-w-0 flex-1 cursor-pointer bg-transparent py-2 text-sm font-medium text-[#1D2238] outline-none"
              >
                <option value="all">همه تسک‌ها</option>
                <option value="completed">تکمیل‌شده</option>
                <option value="incomplete">در حال انجام</option>
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchTasks}
              className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition hover:bg-red-50 sm:self-auto"
            >
              <RefreshCw size={14} />
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Task list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-lg font-bold text-[#1D2238]">فهرست تسک‌ها</h2>
            {!loading && !error && (
              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                {tasks.length.toLocaleString("fa-IR")} مورد
              </span>
            )}
          </div>

          {loading ? (
            <div
              className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              role="status"
              aria-live="polite"
            >
              <LoaderCircle size={30} className="animate-spin text-[#E20912]" />
              <p className="text-sm text-slate-500">در حال دریافت تسک‌ها...</p>
            </div>
          ) : error ? null : tasks.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1D2238]/[0.05] text-slate-400">
                <ListTodo size={30} />
              </div>
              <h3 className="text-base font-bold text-[#1D2238]">
                تسکی پیدا نشد
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
                عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده؛ یا یک تسک جدید ایجاد کن.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                  setShowForm(true);
                }}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1D2238] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#33384C]"
              >
                <Plus size={16} />
                ایجاد تسک جدید
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isEditing = editingId === task.id;
                const isCompleted = Boolean(task.completed);
                const isDeleting = deletingId === task.id;
                const isUpdating = updatingId === task.id;

                return (
                  <article
                    key={task.id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                      isCompleted
                        ? "border-emerald-100"
                        : "border-slate-200/80"
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleUpdateTask}
                        className="space-y-5 p-5 sm:p-6"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                            <Pencil size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold">ویرایش تسک</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              تغییرات را ثبت کن یا از ویرایش خارج شو.
                            </p>
                          </div>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">
                            عنوان تسک
                          </span>
                          <input
                            name="title"
                            value={editForm.title}
                            onChange={handleEditChange}
                            maxLength={120}
                            required
                            autoFocus
                            className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 py-3 text-sm outline-none transition focus:border-[#1D2238] focus:ring-4 focus:ring-[#1D2238]/[0.06]"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">
                            توضیحات
                          </span>
                          <textarea
                            name="description"
                            value={editForm.description}
                            onChange={handleEditChange}
                            maxLength={2000}
                            rows={3}
                            className="w-full resize-y rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#1D2238] focus:ring-4 focus:ring-[#1D2238]/[0.06]"
                          />
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="completed"
                            checked={editForm.completed}
                            onChange={handleEditChange}
                            className="h-4 w-4 accent-[#E20912]"
                          />
                          تسک تکمیل شده است
                        </label>

                        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1D2238] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#33384C] disabled:opacity-50"
                          >
                            {savingEdit ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setActionError("");
                            }}
                            disabled={savingEdit}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <X size={16} />
                            انصراف
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task)}
                            disabled={isUpdating || updatingId !== null}
                            aria-label={`تغییر وضعیت ${task.title}`}
                            title={
                              isCompleted
                                ? "علامت‌گذاری به‌عنوان در حال انجام"
                                : "علامت‌گذاری به‌عنوان تکمیل‌شده"
                            }
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isCompleted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-slate-200 bg-white text-slate-400 hover:border-[#E20912] hover:text-[#E20912]"
                            }`}
                          >
                            {isUpdating ? (
                              <LoaderCircle size={17} className="animate-spin" />
                            ) : isCompleted ? (
                              <Check size={18} />
                            ) : (
                              <span className="h-2.5 w-2.5 rounded-full border-2 border-current" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <h3
                              className={`break-words text-base font-bold leading-7 ${
                                isCompleted
                                  ? "text-slate-400 line-through decoration-slate-300"
                                  : "text-[#1D2238]"
                              }`}
                            >
                              {task.title}
                            </h3>

                            {task.description && (
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isCompleted
                                      ? "bg-emerald-500"
                                      : "bg-amber-500"
                                  }`}
                                />
                                {isCompleted ? "تکمیل‌شده" : "در حال انجام"}
                              </span>

                              {task.created_at && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                  <Clock3 size={13} />
                                  <span>{formatTaskDate(task.created_at)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                          <button
                            type="button"
                            onClick={() => startEditing(task)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#1D2238]"
                            aria-label={`ویرایش ${task.title}`}
                          >
                            <Pencil size={15} />
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => promptDeleteTask(task)}
                            disabled={isDeleting}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`حذف ${task.title}`}
                          >
                            {isDeleting ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            {isDeleting ? "در حال حذف..." : "حذف"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {!loading && !error && tasks.length > 0 && (
          <footer className="flex flex-col gap-2 border-t border-slate-200 px-1 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              نمایش {tasks.length.toLocaleString("fa-IR")} تسک مطابق با فیلتر فعلی
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E20912]" />
              IDICorp Service Console
            </span>
          </footer>
        )}

        {taskToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3 text-red-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <Trash2 size={20} />
                </div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-[#1D2238]">
                  تأیید حذف تسک
                </h3>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                آیا از حذف تسک «<strong className="text-[#1D2238]">{taskToDelete.title}</strong>» مطمئن هستید؟
              </p>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTask}
                  className="rounded-xl bg-[#E20912] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C80710]"
                >
                  حذف تسک
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
