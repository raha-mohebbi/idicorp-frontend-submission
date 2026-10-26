import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Plug, Unplug } from "lucide-react";

const WS_URL = import.meta.env.DEV
  ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/echo`
  : "wss://ts.idicorp.ir/ws/echo";

export default function EchoPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  function connect() {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

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
    };

    socket.onmessage = (event) => {
      let text = event.data;

      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "ready") {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              kind: "system",
              text: "اتصال به سرویس Echo برقرار شد.",
            },
          ]);
          return;
        }

        if (typeof parsed.message === "string") {
          text = parsed.message;
        }
      } catch {
        // پاسخ متنی ساده است؛ همان را نمایش می‌دهیم.
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          kind: "received",
          text: String(text),
        },
      ]);
    };

    socket.onerror = () => {
      setError("ارتباط با سرویس Echo با خطا مواجه شد.");
    };

    socket.onclose = () => {
      setConnected(false);
      setConnecting(false);
      socketRef.current = null;
    };
  }

  function disconnect() {
    socketRef.current?.close();
    socketRef.current = null;
    setConnected(false);
    setConnecting(false);
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

    socketRef.current.send(text);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        kind: "sent",
        text,
      },
    ]);

    setMessage("");
    setError("");
  }

  return (
    <section className="tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">SERVICE CONSOLE</p>
          <h1>سرویس Echo</h1>
          <p className="tasks-description">
            ارسال پیام متنی و دریافت پاسخ از طریق WebSocket.
          </p>
        </div>
        <MessageCircle size={28} />
      </header>

      <div className="tasks-state" role="status">
        {connecting
          ? "در حال اتصال..."
          : connected
            ? "اتصال برقرار است"
            : "آماده اتصال"}
      </div>

      <div className="echo-actions">
        <button
          type="button"
          className="tasks-create-button"
          onClick={connect}
          disabled={connected || connecting}
        >
          <Plug size={16} />
          {connecting ? "در حال اتصال..." : "اتصال"}
        </button>

        <button
          type="button"
          className="task-action-button"
          onClick={disconnect}
          disabled={!connected && !connecting}
        >
          <Unplug size={16} />
          قطع اتصال
        </button>
      </div>

      <div className="echo-message-list" aria-live="polite">
        {messages.length === 0 ? (
          <p className="tasks-state">هنوز پیامی ارسال نشده است.</p>
        ) : (
          messages.map((item) => (
            <article
              className={`echo-message echo-message-${item.kind}`}
              key={item.id}
            >
              <span>
                {item.kind === "sent"
                  ? "ارسال‌شده"
                  : item.kind === "received"
                    ? "پاسخ سرور"
                    : "وضعیت"}
              </span>
              <p>{item.text}</p>
            </article>
          ))
        )}
      </div>

      <form className="echo-composer" onSubmit={sendMessage}>
        <label className="task-form-field">
          <span>پیام</span>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="پیامت را بنویس..."
            disabled={!connected}
            maxLength={2000}
          />
        </label>

        <button
          type="submit"
          className="tasks-create-button"
          disabled={!connected || !message.trim()}
        >
          <Send size={16} />
          ارسال
        </button>
      </form>

      {error && (
        <p className="tasks-error-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
