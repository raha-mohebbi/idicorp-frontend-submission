import { useEffect, useRef, useState } from "react";
import { Calculator } from "lucide-react";
import { getAccessToken } from "../../lib/api";

const WS_URL = import.meta.env.DEV
  ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/calculator`
  : `${(import.meta.env.VITE_API_BASE_URL || "https://ts.idicorp.ir").replace(/^http/, "ws")}/ws/calculator`;

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
      values.some((value) => !Number.isFinite(value) || Math.abs(value) > 1e12)
    ) {
      setError("۱ تا ۱۰۰ عدد معتبر با قدر مطلق حداکثر ۱۰ به توان ۱۲ وارد کن.");
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
        setError("سرور درخواست محاسبه را نپذیرفت. ورودی‌ها را بررسی کن.");
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

  return (
    <section className="tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">SERVICE CONSOLE</p>
          <h1>ماشین‌حساب</h1>
          <p className="tasks-description">
            انجام عملیات ریاضی از طریق WebSocket احراز هویت‌شده.
          </p>
        </div>
        <Calculator size={28} />
      </header>

      <div className="tasks-state" role="status">
        {connecting ? "در حال محاسبه..." : "آماده محاسبه"}
      </div>

      <form className="task-form" onSubmit={handleCalculate}>
        <label className="task-form-field">
          <span>عملیات</span>
          <select
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
            disabled={connecting}
          >
            <option value="add">جمع</option>
            <option value="subtract">تفریق</option>
            <option value="multiply">ضرب</option>
            <option value="divide">تقسیم</option>
          </select>
        </label>

        {numbers.map((number, index) => (
          <div className="calculator-number-row" key={index}>
            <label className="task-form-field">
              <span>عدد {index + 1}</span>
              <input
                type="number"
                step="any"
                value={number}
                onChange={(event) =>
                  handleNumberChange(index, event.target.value)
                }
                required
                disabled={connecting}
              />
            </label>

            <button
              type="button"
              className="task-action-button"
              onClick={() => removeNumber(index)}
              disabled={connecting || numbers.length <= 1}
              aria-label={`حذف عدد ${index + 1}`}
            >
              حذف
            </button>
          </div>
        ))}
        <button
          type="button"
          className="task-action-button"
          onClick={addNumber}
          disabled={connecting || numbers.length >= 100}
        >
          افزودن عدد ({numbers.length}/100)
        </button>
        <button
          type="submit"
          className="tasks-create-button"
          disabled={connecting}
        >
          {connecting ? "در حال محاسبه..." : "محاسبه"}
        </button>
      </form>

      {error && (
        <p className="tasks-error-message" role="alert">
          {error}
        </p>
      )}

      {result !== null && (
        <div className="tasks-success" role="status">
          نتیجه: <strong>{result}</strong>
        </div>
      )}
    </section>
  );
}