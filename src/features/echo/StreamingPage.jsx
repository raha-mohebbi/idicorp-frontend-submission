import { useState } from "react";
import {
  Radio,
  Send,
  Trash2,
  LoaderCircle,
  CircleCheck,
  CircleAlert,
  ShieldCheck,
  FileText,
  Waves,
  Sparkles,
} from "lucide-react";
import { getAccessToken } from "../../lib/api";

const API_BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "https://ts.idicorp.ir";

export default function StreamingPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const text = input.trim();

    if (!text) {
      setError("ابتدا متنی برای ارسال وارد کن.");
      return;
    }

    if (text.length > 20000) {
      setError("حداکثر طول متن ورودی ۲۰٬۰۰۰ کاراکتر است.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setResponse("");
    setStatus("در حال ارسال درخواست...");

    let reader;

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error(
          "توکن ورود پیدا نشد. ابتدا از حساب خارج شو و دوباره وارد شو.",
        );
      }

      const headers = {
        "Content-Type": "text/plain; charset=utf-8",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      };

      const result = await fetch(`${API_BASE_URL}/api/echo/stream`, {
        method: "POST",
        headers,
        credentials: "include",
        body: text,
      });

      if (!result.ok) {
        let message = "";

        try {
          const contentType = result.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const data = await result.json();
            message =
              typeof data?.detail === "string"
                ? data.detail
                : typeof data?.message === "string"
                  ? data.message
                  : "";
          } else {
            message = (await result.text()).slice(0, 300);
          }
        } catch {
      //if parsing fails, ignore and use default message
        }

        if (result.status === 401) {
          throw new Error(
            "نشست یا توکن معتبر نیست یا منقضی شده است. دوباره وارد شو.",
          );
        }

        if (result.status === 403) {
          throw new Error(
            "اجازه دسترسی به سرویس Streaming وجود ندارد.",
          );
        }

        if (result.status === 404) {
          throw new Error("مسیر سرویس Streaming پیدا نشد.");
        }

        if (result.status === 422) {
          throw new Error(
            message || "متن یا قالب درخواست توسط سرور پذیرفته نشد.",
          );
        }

        if (result.status >= 500) {
          throw new Error(
            message || "خطایی در سرویس سرور رخ داده است.",
          );
        }

        throw new Error(
          message || `درخواست ناموفق بود (${result.status}).`,
        );
      }

      if (!result.body) {
        throw new Error("پاسخ دریافتی قابل خواندن نیست.");
      }

      setStatus("در حال دریافت پاسخ...");

      reader = result.body.getReader();

      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        fullText += decoder.decode(value, { stream: true });
        setResponse(fullText);
      }

      fullText += decoder.decode();
      setResponse(fullText);
      setStatus("پاسخ با موفقیت دریافت شد.");
    } catch (err) {
      setStatus("");

      if (err instanceof TypeError) {
        setError(
          "اتصال به سرور برقرار نشد. اینترنت، آدرس API یا تنظیمات CORS را بررسی کن.",
        );
      } else {
        setError(err.message || "ارسال درخواست ناموفق بود.");
      }
    } finally {
      if (reader) {
        try {
          reader.releaseLock();
        } catch {
          //maybe already released or not supported
        }
      }

      setLoading(false);
    }
  }

  function clearForm() {
    if (loading) return;

    setInput("");
    setResponse("");
    setError("");
    setStatus("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F5F6FA] px-4 py-6 text-[#1D2238] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-3xl bg-[#1D2238] p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
          <div className="pointer-events-none absolute -left-12 -top-20 h-64 w-64 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-[#E20912]/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#E20912]" />
                SERVICE CONSOLE
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Echo Streaming
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  ارسال متن به سرویس و مشاهده‌ی تدریجی پاسخ سرور، هم‌زمان
                  با دریافت داده‌ها.
                </p>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
              <Radio size={30} strokeWidth={1.7} />
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-2">
              <Waves size={15} />
              دریافت تدریجی داده
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-2">
              <ShieldCheck size={15} />
              سرویس احراز هویت‌شده
            </span>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D2238]/[0.06] text-[#1D2238]">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="font-bold text-[#1D2238]">درخواست جدید</h2>
              <p className="mt-1 text-xs text-slate-500">
                متن ورودی را وارد و برای سرویس ارسال کن.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>متن ورودی</span>
                <span
                  className={`text-xs font-normal ${
                    input.length >= 18000
                      ? "text-[#E20912]"
                      : "text-slate-400"
                  }`}
                >
                  {input.length.toLocaleString("fa-IR")} / ۲۰٬۰۰۰
                </span>
              </span>

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="متن موردنظر را برای ارسال به سرور وارد کن..."
                rows={6}
                maxLength={20000}
                disabled={loading}
                required
                className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-[#FCFBFF] px-4 py-3.5 text-sm leading-7 text-[#1D2238] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1D2238] focus:bg-white focus:ring-4 focus:ring-[#1D2238]/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-slate-500">
                {loading
                  ? "در حال پردازش درخواست؛ لطفاً صبر کن."
                  : "پس از ارسال، پاسخ سرور به‌صورت زنده نمایش داده می‌شود."}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#1D2238] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  پاک‌کردن
                </button>

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E20912] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-900/10 transition hover:bg-[#C80710] focus:outline-none focus:ring-4 focus:ring-[#E20912]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {loading ? "در حال دریافت..." : "ارسال و دریافت"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {(status || error) && (
          <div
            role={error ? "alert" : "status"}
            aria-live="polite"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6 ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : status.includes("موفقیت")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {error ? (
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
            ) : status.includes("موفقیت") ? (
              <CircleCheck size={19} className="mt-0.5 shrink-0" />
            ) : (
              <LoaderCircle size={19} className="mt-0.5 shrink-0 animate-spin" />
            )}

            <p>{error || status}</p>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E20912]/[0.07] text-[#E20912]">
                <Radio size={20} />
              </div>

              <div>
                <h2 className="font-bold text-[#1D2238]">پاسخ سرور</h2>
                <p className="mt-1 text-xs text-slate-500">
                  خروجی دریافتی از Endpoint استریم
                </p>
              </div>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                loading
                  ? "bg-blue-50 text-blue-700"
                  : error
                    ? "bg-red-50 text-red-700"
                    : response
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  loading
                    ? "animate-pulse bg-blue-500"
                    : error
                      ? "bg-red-500"
                      : response
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                }`}
              />
              {loading
                ? "در حال دریافت"
                : error
                  ? "خطا در درخواست"
                  : response
                    ? "پاسخ دریافت شد"
                    : "آماده"}
            </div>
          </div>

          <div className="p-4 sm:p-7">
            <div
              className={`relative min-h-64 overflow-hidden rounded-xl border ${
                response
                  ? "border-slate-200 bg-[#FCFBFF]"
                  : "border-dashed border-slate-200 bg-slate-50/70"
              }`}
            >
              {response ? (
                <div className="p-4 sm:p-6">
                  {loading && (
                    <div className="mb-4 flex items-center gap-2 text-xs font-medium text-blue-700">
                      <Sparkles size={15} className="animate-pulse" />
                      پاسخ در حال تکمیل است...
                    </div>
                  )}

                  <pre
                    aria-live="polite"
                    aria-label="متن پاسخ دریافتی"
                    className="whitespace-pre-wrap break-words font-mono text-sm leading-8 text-slate-800"
                  >
                    {response}
                    {loading && (
                      <span className="mr-1 inline-block h-4 w-1 animate-pulse rounded-sm bg-[#E20912] align-middle" />
                    )}
                  </pre>
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/80">
                    {loading ? (
                      <LoaderCircle
                        size={25}
                        className="animate-spin text-[#E20912]"
                      />
                    ) : (
                      <Waves size={25} />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-700">
                    {loading
                      ? "منتظر دریافت داده..."
                      : "هنوز پاسخی دریافت نشده است"}
                  </h3>

                  <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">
                    {loading
                      ? "به‌محض رسیدن داده از سرور، متن پاسخ در این قسمت نمایش داده می‌شود."
                      : "برای مشاهده‌ی خروجی، متن خود را در بخش بالا وارد و درخواست را ارسال کن."}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-500">
              <CircleCheck size={15} className="mt-1 shrink-0 text-slate-400" />
              <p>
                متن پاسخ با رسیدن هر بخش از داده به‌روزرسانی می‌شود؛
                لازم نیست تا پایان درخواست برای مشاهده‌ی خروجی صبر کنی.
              </p>
            </div>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-400">
          IDICorp Service Console
        </footer>
      </div>
    </main>
  );
}