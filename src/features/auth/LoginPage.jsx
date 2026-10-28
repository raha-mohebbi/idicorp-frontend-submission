
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  api,
  clearAccessToken,
  getErrorMessage,
  setAccessToken,
} from "../../lib/api";

const loginSchema = z.object({
  username: z.string().trim().min(1, "نام کاربری را وارد کنید."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
  captcha_answer: z.string().trim().min(1, "پاسخ کپچا را وارد کنید."),
});

export default function LoginPage({ onLogin }) {
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      captcha_answer: "",
    },
  });

  async function loadCaptcha() {
    setCaptchaLoading(true);
    setCaptchaError("");
    setCaptcha(null);

    try {
      const { data } = await api.get("/api/auth/login", {
        params: { _t: Date.now() },
      });
      setCaptcha(data);
    } catch {
      setCaptchaError("دریافت کپچا ناموفق بود.");
    } finally {
      setCaptchaLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchCaptcha() {
      try {
        const { data } = await api.get("/api/auth/login", {
          params: { _t: Date.now() },
        });

        if (!cancelled) {
          setCaptcha(data);
          setCaptchaError("");
        }
      } catch {
        if (!cancelled) {
          setCaptchaError("دریافت کپچا ناموفق بود.");
        }
      } finally {
        if (!cancelled) {
          setCaptchaLoading(false);
        }
      }
    }

    fetchCaptcha();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values) {
    setLoginError("");

    try {
      const { data } = await api.post("/api/auth/login", {
        username: values.username,
        password: values.password,
        salt: captcha.salt,
        captcha_answer: values.captcha_answer,
      });

      if (!data?.access_token) {
        throw new Error("پاسخ ورود فاقد access token است.");
      }

      setAccessToken(data.access_token);
      onLogin(data);
    } catch (error) {
      clearAccessToken();

      setLoginError(
        error.response
          ? getErrorMessage(error)
          : error.message || getErrorMessage(error),
      );

      reset({
        username: values.username,
        password: "",
        captcha_answer: "",
      });

      await loadCaptcha();
    }
  }

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-[#1D2238] outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4 ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
        : "border-slate-200 hover:border-slate-300 focus:border-[#E20912] focus:ring-[#E20912]/10"
    }`;

  return (
    <main
      dir="rtl"
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F6FA] px-4 py-10 font-sans text-[#1D2238] selection:bg-[#E20912]/15 selection:text-[#1D2238]"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-32 -top-36 h-[420px] w-[420px] rounded-full bg-[#E20912]/[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -left-28 h-[450px] w-[450px] rounded-full bg-[#1D2238]/[0.07] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(#1D2238 0.8px, transparent 0.8px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <section
        aria-labelledby="login-title"
        className="w-full max-w-[460px] animate-[fadeIn_.5s_ease-out] rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_80px_-24px_rgba(29,34,56,0.20)] backdrop-blur-xl sm:p-10"
      >
        {/* Brand */}
        <div className="mb-9 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D2238] text-white shadow-lg shadow-[#1D2238]/20">
              <LockKeyhole size={23} strokeWidth={1.8} />
              <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#E20912]" />
            </div>

            <div>
              <p
                dir="ltr"
                className="text-sm font-extrabold tracking-[0.12em] text-[#1D2238]"
              >
                IDICORP
              </p>
              <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-500">
                Service Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            دسترسی امن
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold tracking-wide text-[#E20912]">
            به پنل خوش آمدید
          </p>

          <h1
            id="login-title"
            className="text-3xl font-black tracking-tight text-[#1D2238] sm:text-[34px]"
          >
            ورود به حساب
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            برای دسترسی به سرویس‌های سازمانی، اطلاعات حساب خود را وارد کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-bold text-[#33384C]"
            >
              نام کاربری
            </label>

            <input
              id="username"
              autoComplete="username"
              placeholder="نام کاربری خود را وارد کنید"
              className={inputClass(Boolean(errors.username))}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={
                errors.username ? "username-error" : undefined
              }
              {...register("username")}
            />

            {errors.username && (
              <p
                id="username-error"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600"
              >
                <span>•</span>
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-bold text-[#33384C]"
            >
              رمز عبور
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="رمز عبور خود را وارد کنید"
                className={`${inputClass(
                  Boolean(errors.password),
                )} pl-12`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />

              <button
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#1D2238] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E20912]/30"
                type="button"
                aria-label={
                  showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {errors.password && (
              <p
                id="password-error"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600"
              >
                <span>•</span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Captcha */}
          <div className="space-y-2">
            <label
              htmlFor="captcha_answer"
              className="block text-sm font-bold text-[#33384C]"
            >
              کد امنیتی
            </label>

            {captchaLoading ? (
              <div
                role="status"
                className="flex h-[76px] items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
              >
                <RefreshCw size={17} className="animate-spin" />
                در حال دریافت کد امنیتی...
              </div>
            ) : captcha?.captcha ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-white">
                  <img
                    src={captcha.captcha}
                    alt="تصویر کد امنیتی"
                    className="h-[54px] max-w-full object-contain"
                  />
                </div>

                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#E20912]/30 hover:bg-red-50 hover:text-[#E20912] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E20912]/30 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={loadCaptcha}
                  disabled={isSubmitting || captchaLoading}
                  aria-label="دریافت کپچای جدید"
                  title="تازه‌سازی کد امنیتی"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            ) : (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
              >
                <span>{captchaError || "تصویر کپچا در دسترس نیست."}</span>

                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="inline-flex items-center gap-1 font-bold underline underline-offset-4"
                >
                  تلاش دوباره
                </button>
              </div>
            )}

            <input
              id="captcha_answer"
              autoComplete="off"
              placeholder="متن داخل تصویر را وارد کنید"
              className={inputClass(Boolean(errors.captcha_answer))}
              aria-invalid={Boolean(errors.captcha_answer)}
              aria-describedby={
                errors.captcha_answer ? "captcha-error" : undefined
              }
              {...register("captcha_answer")}
            />

            {errors.captcha_answer && (
              <p
                id="captcha-error"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600"
              >
                <span>•</span>
                {errors.captcha_answer.message}
              </p>
            )}
          </div>

          {/* Login error */}
          {loginError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                !
              </span>
              <p>{loginError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#E20912] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#E20912]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C90710] hover:shadow-xl hover:shadow-[#E20912]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E20912]/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            type="submit"
            disabled={isSubmitting || captchaLoading || !captcha}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                در حال بررسی اطلاعات...
              </>
            ) : (
              <>
                <span>ورود به پنل</span>
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-[#1D2238]/60" />
            <span>دسترسی محافظت‌شده به سرویس‌های IDICorp</span>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
