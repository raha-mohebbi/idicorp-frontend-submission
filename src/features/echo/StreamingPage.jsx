import { useState } from "react";
import { Radio, Send, Trash2 } from "lucide-react";
import { getAccessToken, getErrorMessage } from "../../lib/api";

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

    if (loading) return;

    setLoading(true);
    setError("");
    setResponse("");
    setStatus("در حال ارسال درخواست...");

    const token = getAccessToken();

    try {
      const headers = {
        "Content-Type": "text/plain; charset=utf-8",
        Accept: "*/*",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const result = await fetch(`${API_BASE_URL}/api/echo/stream`, {
        method: "POST",
        headers,
        credentials: "include",
        body: text,
      });

      if (!result.ok) {
        let message = "";

        try {
          const data = await result.json();
          message =
            typeof data?.detail === "string" ? data.detail : "";
        } catch {
          // The error response may not be JSON.
        }

        if (result.status === 401) {
          throw new Error(
            "نشست معتبر نیست یا منقضی شده است. دوباره وارد شو."
          );
        }

        if (result.status === 403) {
          throw new Error("اجازهٔ دسترسی به سرویس Streaming وجود ندارد.");
        }

        if (result.status === 422) {
          throw new Error("متن ارسال‌شده معتبر نیست.");
        }

        if (result.status >= 500) {
          throw new Error("خطایی در سرویس رخ داده است.");
        }

        throw new Error(
          message || `درخواست ناموفق بود (${result.status}).`
        );
      }

      if (!result.body) {
        throw new Error("پاسخ دریافتی قابل خواندن نیست.");
      }

      setStatus("در حال دریافت پاسخ...");
      const reader = result.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          fullText += decoder.decode(value, { stream: true });
          setResponse(fullText);
        }

        fullText += decoder.decode();
        setResponse(fullText);
      } finally {
        reader.releaseLock();
      }

      setStatus("پاسخ با موفقیت دریافت شد.");
    } catch (err) {
      setStatus("");

      if (err instanceof TypeError) {
        setError(
          "اتصال به سرور برقرار نشد. اینترنت، پراکسی یا تنظیمات دسترسی را بررسی کن."
        );
      } else {
        setError(
          err.message ||
            getErrorMessage(err) ||
            "ارسال درخواست ناموفق بود."
        );
      }
    } finally {
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
    <section className="tasks-page">
      <header className="tasks-header">
        <div>
          <p className="eyebrow">SERVICE CONSOLE</p>
          <h1>Echo Streaming</h1>
          <p className="tasks-description">
            ارسال متن و نمایش تدریجی پاسخ دریافتی از سرور.
          </p>
        </div>

        <Radio size={28} />
      </header>

      <form onSubmit={handleSubmit}>
        <label className="task-form-field">
          <span>متن ورودی</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="متن موردنظر را وارد کن..."
            rows={5}
            maxLength={20000}
            disabled={loading}
            required
          />
        </label>

        <div className="echo-actions">
          <button
            type="submit"
            className="tasks-create-button"
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
            {loading ? "در حال دریافت..." : "ارسال و دریافت"}
          </button>

          <button
            type="button"
            className="task-action-button"
            onClick={clearForm}
            disabled={loading}
          >
            <Trash2 size={16} />
            پاک‌کردن
          </button>
        </div>
      </form>

      {status && (
        <p className="tasks-state" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {error && (
        <p className="tasks-error-message" role="alert">
          {error}
        </p>
      )}

      <section className="stream-response" aria-label="پاسخ سرویس">
        <h2>پاسخ سرور</h2>
        {response ? (
          <pre aria-live="polite">{response}</pre>
        ) : (
          <p className="tasks-state">
            {loading
              ? "منتظر دریافت داده..."
              : "هنوز پاسخی دریافت نشده است."}
          </p>
        )}
      </section>
    </section>
  );
}