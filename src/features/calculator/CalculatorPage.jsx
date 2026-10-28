
import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  ArrowLeft,
  Hash,
  Wifi,
  LoaderCircle,
  CircleCheck,
  CircleAlert,
  RotateCcw,
  Sigma,
  Divide,
  Minus,
  X,
} from "lucide-react";
import { getAccessToken } from "../../lib/api";

const WS_URL = import.meta.env.DEV
  ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/calculator`
  : `${(import.meta.env.VITE_API_BASE_URL || "https://ts.idicorp.ir").replace(/^http/, "ws")}/ws/calculator`;

const operations = [
  { value: "add", label: "جمع", symbol: "+", icon: Plus },
  { value: "subtract", label: "تفریق", symbol: "−", icon: Minus },
  { value: "multiply", label: "ضرب", symbol: "×", icon: X },
  { value: "divide", label: "تقسیم", symbol: "÷", icon: Divide },
];

export default function CalculatorPage() {
  const [operation, setOperation] = useState("add");
  const [numbers, setNumbers] = useState(["", ""]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const socketRef = useRef(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  function handleNumberChange(index, value) {
    setNumbers((current) =>
      current.map((number, i) => (i === index ? value : number)),
    );
  }

  function addNumber() {
    setNumbers((current) => {
      if (current.length >= 100) return current;
      return [...current, ""];
    });
  }

  function removeNumber(index) {
    setNumbers((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, i) => i !== index);
    });
  }

  function resetCalculator() {
    if (connecting) return;
    setNumbers(["", ""]);
    setResult(null);
    setError("");
    setOperation("add");
  }

  function handleCalculate(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (pendingRef.current) {
      setError("درخواست قبلی هنوز در حال پردازش است.");
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError("نشست ورود پیدا نشد. خارج شو و دوباره وارد شو.");
      return;
    }

    const values = numbers.map((value) => Number(value));

    if (
      numbers.some((value) => value.trim() === "") ||
      values.some(
        (value) => !Number.isFinite(value) || Math.abs(value) > 1e12,
      )
    ) {
      setError(
        "۱ تا ۱۰۰ عدد معتبر با قدر مطلق حداکثر ۱۰ به توان ۱۲ وارد کن.",
      );
      return;
    }

    if (values.length < 1 || values.length > 100) {
      setError("تعداد اعداد باید بین ۱ تا ۱۰۰ باشد.");
      return;
    }

    if (operation === "divide" && values.some((value) => value === 0)) {
      setError("برای تقسیم، عدد صفر قابل قبول نیست.");
      return;
    }

    setConnecting(true);
    pendingRef.current = true;

    let socket;

    try {
      socket = new WebSocket(WS_URL);
      socketRef.current = socket;
    } catch {
      pendingRef.current = false;
      setConnecting(false);
      setError("اتصال WebSocket ساخته نشد.");
      return;
    }

    let authenticated = false;
    let requestSent = false;
    let completed = false;

    socket.onopen = () => {
      socket.send(JSON.stringify({ token }));
    };

    socket.onmessage = (event) => {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch {
        completed = true;
        setError("پاسخ نامعتبر از سرور دریافت شد.");
        pendingRef.current = false;
        setConnecting(false);
        socket.close();
        return;
      }

      if (message.type === "ready") {
        authenticated = true;

        if (!requestSent) {
          requestSent = true;
          socket.send(JSON.stringify({ operation, numbers: values }));
        }

        return;
      }

      if (
        typeof message.result === "number" &&
        Number.isFinite(message.result)
      ) {
        completed = true;
        setResult(message.result);
        setError("");
        pendingRef.current = false;
        setConnecting(false);
        socket.close();
        return;
      }

      if (message.error) {
        completed = true;
        setError(
          "سرور درخواست محاسبه را نپذیرفت. ورودی‌ها را بررسی کن.",
        );
        pendingRef.current = false;
        setConnecting(false);
        socket.close();
      }
    };

    socket.onerror = () => {
      setError("ارتباط با ماشین‌حساب برقرار نشد.");
      pendingRef.current = false;
      setConnecting(false);
    };

    socket.onclose = () => {
      pendingRef.current = false;
      setConnecting(false);

      if (!completed) {
        setError(
          authenticated
            ? "اتصال پیش از دریافت نتیجه بسته شد. دوباره تلاش کن."
            : "احراز هویت WebSocket ناموفق بود یا اتصال بسته شد.",
        );
      }
    };
  }

  const selectedOperation = operations.find(
    (item) => item.value === operation,
  );

  return (
    <main
      dir="rtl"
      className="min-h-full space-y-7 pb-10 text-[#1D2238]"
    >
      {/* Page header */}
      <header className="relative overflow-hidden rounded-3xl bg-[#1D2238] p-6 text-white shadow-xl shadow-[#1D2238]/10 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 -top-20 h-64 w-64 rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-2 -top-10 h-44 w-44 rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-[#E20912]/20 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E20912]" />
              SERVICE CONSOLE
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              ماشین‌حساب
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
              انجام عملیات ریاضی با ارتباط امن و احراز هویت از طریق WebSocket.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/80">
                <Wifi size={14} />
                WebSocket
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/80">
                <Hash size={14} />
                حداکثر ۱۰۰ عدد
              </span>
            </div>
          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl border border-white/10 bg-white/[0.07] text-white shadow-inner sm:h-24 sm:w-24 sm:self-center">
            <Calculator size={42} strokeWidth={1.4} />
          </div>
        </div>
      </header>

      {/* Connection status */}
      <div
        role="status"
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 ${
          connecting
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              connecting
                ? "bg-amber-100"
                : "bg-slate-100 text-[#1D2238]"
            }`}
          >
            {connecting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <CircleCheck size={18} />
            )}
          </span>

          <div>
            <p className="text-sm font-bold">
              {connecting ? "در حال انجام محاسبه" : "آماده محاسبه"}
            </p>
            <p className="mt-1 text-xs opacity-75">
              {connecting
                ? "در انتظار پاسخ سرویس..."
                : "مقادیر را وارد و عملیات موردنظر را انتخاب کن."}
            </p>
          </div>
        </div>

        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            connecting ? "animate-pulse bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </div>

      {/* Calculator workspace */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">ورودی‌های محاسبه</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                تعداد دلخواهی عدد اضافه کن و عملیات را اجرا کن.
              </p>
            </div>

            <button
              type="button"
              onClick={resetCalculator}
              disabled={connecting}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-[#1D2238]/20 hover:bg-slate-50 hover:text-[#1D2238] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={14} />
              پاک‌سازی
            </button>
          </div>

          <form onSubmit={handleCalculate} className="space-y-6">
            {/* Operation selector */}
            <fieldset disabled={connecting} className="space-y-3">
              <legend className="mb-3 text-sm font-bold text-[#33384C]">
                انتخاب عملیات
              </legend>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {operations.map((item) => {
                  const active = operation === item.value;
                  const Icon = item.icon;

                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setOperation(item.value)}
                      aria-pressed={active}
                      className={`group flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-2xl border p-3 transition-all duration-200 ${
                        active
                          ? "border-[#E20912]/30 bg-[#E20912]/[0.045] text-[#E20912] shadow-sm shadow-[#E20912]/5"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-[#1D2238]"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                          active
                            ? "bg-[#E20912] text-white shadow-md shadow-[#E20912]/20"
                            : "bg-slate-100 text-[#1D2238] group-hover:bg-slate-200"
                        }`}
                      >
                        <Icon size={19} />
                      </span>

                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Numbers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#33384C]">
                  اعداد ورودی
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold tabular-nums text-slate-600">
                  {numbers.length} / 100
                </span>
              </div>

              <div className="space-y-3">
                {numbers.map((number, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-slate-300 hover:bg-white sm:p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-extrabold tabular-nums text-slate-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <label className="min-w-0 flex-1">
                      <span className="mb-1.5 block text-[11px] font-medium text-slate-500">
                        عدد {index + 1}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={number}
                        onChange={(event) =>
                          handleNumberChange(index, event.target.value)
                        }
                        placeholder="مقدار را وارد کن"
                        required
                        disabled={connecting}
                        className="w-full min-w-0 bg-transparent text-sm font-semibold text-[#1D2238] outline-none placeholder:font-normal placeholder:text-slate-400 disabled:opacity-60"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeNumber(index)}
                      disabled={connecting || numbers.length <= 1}
                      aria-label={`حذف عدد ${index + 1}`}
                      title="حذف عدد"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-[#E20912] disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addNumber}
                disabled={connecting || numbers.length >= 100}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:border-[#E20912]/50 hover:bg-red-50/40 hover:text-[#E20912] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={17} />
                افزودن عدد جدید
              </button>
            </div>

            {/* Inline error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700"
              >
                <CircleAlert size={19} className="mt-1 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Calculate button */}
            <button
              type="submit"
              disabled={connecting}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#E20912] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#E20912]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C90710] hover:shadow-xl hover:shadow-[#E20912]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E20912]/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {connecting ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  در حال محاسبه...
                </>
              ) : (
                <>
                  <Calculator size={19} />
                  محاسبه نتیجه
                  <ArrowLeft
                    size={18}
                    className="transition-transform group-hover:-translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </section>

        {/* Result panel */}
        <aside className="space-y-5 xl:sticky xl:top-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D2238] text-white">
                <Sigma size={21} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">نتیجه محاسبه</h2>
                <p className="mt-1 text-xs text-slate-500">
                  خروجی سرویس ماشین‌حساب
                </p>
              </div>
            </div>

            <div
              aria-live="polite"
              className="relative min-h-[190px] overflow-hidden p-5 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#E20912]/[0.055] blur-2xl"
              />

              {result !== null ? (
                <div className="relative">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CircleCheck size={16} />
                    محاسبه موفق بود
                  </div>

                  <p className="mb-2 text-xs text-slate-500">مقدار نهایی</p>

                  <p
                    dir="ltr"
                    className="break-all text-3xl font-black tracking-tight text-[#1D2238] sm:text-4xl"
                  >
                    {String(result)}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                    {selectedOperation?.label}
                    <span className="text-[#E20912]">
                      {selectedOperation?.symbol}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative flex min-h-[145px] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                    <Calculator size={26} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    هنوز نتیجه‌ای وجود ندارد
                  </p>
                  <p className="mt-2 max-w-[230px] text-xs leading-6 text-slate-400">
                    اعداد و عملیات را انتخاب کن و دکمه محاسبه را بزن.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Information card */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-extrabold">راهنمای استفاده</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#1D2238]">
                  <Wifi size={15} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#33384C]">
                    ارتباط با سرور
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    درخواست‌ها از طریق WebSocket ارسال می‌شوند.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#1D2238]">
                  <Hash size={15} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#33384C]">
                    محدوده ورودی
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    حداکثر ۱۰۰ عدد با قدر مطلق حداکثر ۱۰ به توان ۱۲.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#E20912]">
                  <ShieldCheckIcon />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#33384C]">
                    نشست احراز هویت
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    برای محاسبه باید وارد پنل شده باشی.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ShieldCheckIcon() {
  return <CircleCheck size={15} />;
}