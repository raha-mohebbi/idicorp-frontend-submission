
import { useState } from "react";
import {
  ListTodo,
  Calculator,
  LogOut,
  MessageCircle,
  Radio,
  LayoutDashboard,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";

import LoginPage from "./features/auth/LoginPage";
import TasksPage from "./features/tasks/TasksPage";
import CalculatorPage from "./features/calculator/CalculatorPage";
import EchoPage from "./features/echo/EchoPage";
import StreamingPage from "./features/echo/StreamingPage";
import { clearAccessToken } from "./lib/api";

const navigationItems = [
  {
    id: "tasks",
    label: "مدیریت تسک‌ها",
    icon: ListTodo,
  },
  {
    id: "calculator",
    label: "ماشین‌حساب",
    icon: Calculator,
  },
  {
    id: "echo",
    label: "سرویس Echo",
    icon: MessageCircle,
  },
  {
    id: "streaming",
    label: "Echo Streaming",
    icon: Radio,
  },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [activePage, setActivePage] = useState("tasks");

  function handleLogin(data) {
    setSession(data);
    setActivePage("tasks");
  }

  function handleLogout() {
    clearAccessToken();
    setSession(null);
    setActivePage("tasks");
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const ActivePage =
    activePage === "tasks"
      ? TasksPage
      : activePage === "calculator"
        ? CalculatorPage
        : activePage === "echo"
          ? EchoPage
          : StreamingPage;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F5F6FA] text-[#1D2238]"
    >
      {/* Application header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D2238] text-white shadow-sm">
              <LayoutDashboard size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.17em] text-slate-500 sm:text-xs">
                IDICORP · SERVICE CONSOLE
              </p>
              <h1 className="mt-1 truncate text-lg font-bold tracking-tight sm:text-xl">
                پنل سرویس‌ها
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <ShieldCheck size={15} />
              <span>محیط سرویس‌ها</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 sm:px-4"
            >
              <LogOut size={16} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* Page introduction */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              WORKSPACE
            </p>
            <h2 className="mt-1 text-base font-bold text-[#1D2238] sm:text-lg">
              فضای کاری سرویس‌ها
            </h2>
          </div>

          <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            پنل آماده استفاده است
          </span>
        </div>

        {/* Service navigation */}
        <nav
          aria-label="سرویس‌ها"
          className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActivePage(item.id)}
                  className={`group relative flex min-h-14 items-center justify-between gap-3 rounded-xl px-3 py-3 text-right text-sm font-semibold transition sm:px-4 ${
                    isActive
                      ? "bg-[#1D2238] text-white shadow-md shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#1D2238]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-[#1D2238]/[0.06] group-hover:text-[#1D2238]"
                      }`}
                    >
                      <Icon size={19} />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </span>

                  {isActive && (
                    <ChevronLeft
                      size={16}
                      className="shrink-0 text-slate-300"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active service */}
        <section
          key={activePage}
          aria-label="محتوای سرویس انتخاب‌شده"
          className="min-w-0"
        >
          <ActivePage />
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 px-1 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>IDICorp · Service Console</span>
          <span>مدیریت یکپارچه سرویس‌ها</span>
        </footer>
      </div>
    </div>
  );
}
