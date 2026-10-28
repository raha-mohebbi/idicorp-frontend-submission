
import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  Plug,
  Unplug,
  Radio,
  Wifi,
  WifiOff,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  Trash2,
  ShieldCheck,
} from "lucide-react";

const WS_URL = "wss://ts.idicorp.ir/ws/echo";

export default function EchoPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const manuallyDisconnectedRef = useRef(false);

  function addMessage(kind, text) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        kind,
        text,
      },
    ]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      manuallyDisconnectedRef.current = true;
      socketRef.current?.close();
    };
  }, []);

  function connect() {
    const currentSocket = socketRef.current;

    if (
      currentSocket?.readyState === WebSocket.OPEN ||
      currentSocket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    manuallyDisconnectedRef.current = false;
    setError("");
    setConnecting(true);

    let socket;

    try {
      
      socket = new WebSocket(WS_URL);
      socketRef.current = socket;
    } catch {
      setConnecting(false);
      setError("ایجاد اتصال WebSocket ناموفق بود.");
      return;
    }

    socket.onopen = () => {
      setConnecting(false);
      setConnected(true);

      addMessage("system", "اتصال WebSocket برقرار شد.");
    };

    socket.onmessage = (event) => {
      let text = event.data;

      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "ready") {
          addMessage("system", "سرویس Echo آماده دریافت پیام است.");
          return;
        }

        if (typeof parsed.message === "string") {
          text = parsed.message;
        }
      } catch {
        // Non-JSON responses are displayed as plain text.
      }

      addMessage("received", String(text));
    };

    socket.onerror = () => {
      setError(
        "ارتباط با سرویس Echo برقرار نشد. وضعیت سرور و احراز هویت را بررسی کن.",
      );
    };

    socket.onclose = () => {
      setConnected(false);
      setConnecting(false);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (!manuallyDisconnectedRef.current) {
        addMessage("system", "اتصال سرویس بسته شد.");
      }
    };
  }

  function disconnect() {
    manuallyDisconnectedRef.current = true;

    const socket = socketRef.current;
    socketRef.current = null;

    setConnected(false);
    setConnecting(false);
    setError("");

    if (socket) {
      socket.close();
    }

    addMessage("system", "اتصال به سرویس Echo قطع شد.");
  }

  function sendMessage(event) {
    event.preventDefault();

    const text = message.trim();

    if (!text) {
      setError("ابتدا یک پیام وارد کن.");
      return;
    }

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError("ابتدا به سرویس Echo متصل شو.");
      return;
    }

    try {
      socketRef.current.send(text);

      addMessage("sent", text);
      setMessage("");
      setError("");
    } catch {
      setError("ارسال پیام ناموفق بود. اتصال را بررسی کن.");
    }
  }

  function clearMessages() {
    setMessages([]);
    setError("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-full space-y-7 pb-10 text-[#1D2238]"
    >
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
              سرویس Echo
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
              ارسال و دریافت پیام متنی در لحظه با استفاده از ارتباط WebSocket.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/80">
                <Radio size={14} />
                Real-time messaging
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/80">
                <ShieldCheck size={14} />
                WebSocket
              </span>
            </div>
          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl border border-white/10 bg-white/[0.07] text-white sm:h-24 sm:w-24 sm:self-center">
            <MessageCircle size={42} strokeWidth={1.4} />
          </div>
        </div>
      </header>

      <section
        role="status"
        className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${
          connecting
            ? "border-amber-200 bg-amber-50"
            : connected
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              connecting
                ? "bg-amber-100 text-amber-700"
                : connected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {connecting ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : connected ? (
              <Wifi size={20} />
            ) : (
              <WifiOff size={20} />
            )}
          </div>

          <div>
            <p className="text-sm font-extrabold text-[#1D2238]">
              {connecting
                ? "در حال برقراری اتصال"
                : connected
                  ? "اتصال برقرار است"
                  : "اتصال برقرار نیست"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {connecting
                ? "در انتظار پاسخ سرور..."
                : connected
                  ? "سرویس آماده ارسال و دریافت پیام است."
                  : "برای شروع گفتگو به سرویس متصل شو."}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
            connecting
              ? "bg-amber-100 text-amber-800"
              : connected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connecting
                ? "animate-pulse bg-amber-500"
                : connected
                  ? "bg-emerald-500"
                  : "bg-slate-400"
            }`}
          />
          {connecting ? "Connecting" : connected ? "Online" : "Offline"}
        </span>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D2238] text-white">
              <MessageCircle size={20} />
            </div>

            <div>
              <h2 className="text-sm font-extrabold">محیط تبادل پیام</h2>
              <p className="mt-1 text-xs text-slate-500">
                {messages.length} پیام در این نشست
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearMessages}
              disabled={messages.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#1D2238] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} />
              پاک‌سازی پیام‌ها
            </button>

            {connected || connecting ? (
              <button
                type="button"
                onClick={disconnect}
                className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-bold text-[#E20912] transition hover:bg-red-100"
              >
                <Unplug size={15} />
                قطع اتصال
              </button>
            ) : (
              <button
                type="button"
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E20912] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E20912]/15 transition hover:bg-[#C90710]"
              >
                <Plug size={15} />
                اتصال به سرویس
              </button>
            )}
          </div>
        </div>

        <div
          className="min-h-[320px] max-h-[560px] space-y-5 overflow-y-auto bg-[#F8F9FC] p-4 sm:min-h-[380px] sm:p-7"
          aria-label="تاریخچه پیام‌ها"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
                <MessageCircle size={29} strokeWidth={1.5} />
              </div>

              <h3 className="text-sm font-extrabold text-[#1D2238]">
                هنوز پیامی وجود ندارد
              </h3>

              <p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">
                ابتدا به سرویس متصل شو، سپس اولین پیام خود را ارسال کن.
              </p>

              {!connected && !connecting && (
                <button
                  type="button"
                  onClick={connect}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1D2238] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#33384C]"
                >
                  <Plug size={15} />
                  برقراری اتصال
                </button>
              )}
            </div>
          ) : (
            messages.map((item) => {
              if (item.kind === "system") {
                return (
                  <div
                    key={item.id}
                    className="flex justify-center py-1"
                  >
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-[11px] leading-5 text-slate-500 shadow-sm">
                      <CircleCheck
                        size={13}
                        className="shrink-0 text-emerald-600"
                      />
                      {item.text}
                    </div>
                  </div>
                );
              }

              const sent = item.kind === "sent";

              return (
                <article
                  key={item.id}
                  className={`flex ${sent ? "justify-start" : "justify-end"}`}
                >
                  <div className="flex w-fit max-w-[88%] min-w-0 flex-col sm:max-w-[75%]">
                    <div
                      className={`mb-2 flex items-center gap-2 px-1 text-[11px] font-bold ${
                        sent ? "text-[#E20912]" : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sent ? "bg-[#E20912]" : "bg-slate-400"
                        }`}
                      />
                      {sent ? "پیام شما" : "پاسخ سرور"}
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3.5 shadow-sm ${
                        sent
                          ? "rounded-tr-sm border border-[#E20912]/10 bg-[#E20912]/[0.055] text-[#1D2238]"
                          : "rounded-tl-sm border border-slate-200 bg-white text-[#1D2238]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-100 bg-white p-4 sm:p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm leading-6 text-red-700"
            >
              <CircleAlert size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-xs font-bold text-[#33384C]">
                پیام جدید
              </span>

              <input
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) setError("");
                }}
                placeholder={
                  connected
                    ? "پیامت را اینجا بنویس..."
                    : "برای ارسال پیام ابتدا متصل شو"
                }
                disabled={!connected}
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#1D2238] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#E20912] focus:bg-white focus:ring-4 focus:ring-[#E20912]/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
              />

              <span className="mt-2 block text-[10px] text-slate-400">
                حداکثر ۲۰۰۰ کاراکتر
              </span>
            </label>

            <button
              type="submit"
              disabled={!connected || !message.trim()}
              className="flex h-[49px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#E20912] px-4 text-sm font-bold text-white shadow-md shadow-[#E20912]/15 transition hover:bg-[#C90710] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E20912]/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:px-6"
            >
              <Send size={17} />
              <span className="hidden sm:inline">ارسال پیام</span>
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck size={13} />
            ارتباط با سرویس Echo از طریق WebSocket
          </div>
        </div>
      </section>
    </main>
  );
}