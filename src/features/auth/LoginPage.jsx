
import { useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, clearAccessToken, getErrorMessage, setAccessToken } from '../../lib/api'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'نام کاربری را وارد کنید.'),
  password: z.string().min(1, 'رمز عبور را وارد کنید.'),
  captcha_answer: z.string().trim().min(1, 'پاسخ کپچا را وارد کنید.'),
})

export default function LoginPage({ onLogin }) {
  const [captcha, setCaptcha] = useState(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const [captchaError, setCaptchaError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      captcha_answer: '',
    },
  })

  async function loadCaptcha() {
    setCaptchaLoading(true)
    setCaptchaError('')
    setCaptcha(null)

    try {
 const { data } = await api.get('/api/auth/login')
      setCaptcha(data)
    } catch {
      setCaptchaError('دریافت کپچا ناموفق بود.')
    } finally {
      setCaptchaLoading(false)
    }
  }

 useEffect(() => {
  let cancelled = false

  async function fetchCaptcha() {
    try {
      const { data } = await api.get('/api/auth/login', {
  params: { _t: Date.now() },
})

      if (!cancelled) {
        setCaptcha(data)
        setCaptchaError('')
      }
    } catch {
      if (!cancelled) {
        setCaptchaError('دریافت کپچا ناموفق بود.')
      }
    } finally {
      if (!cancelled) {
        setCaptchaLoading(false)
      }
    }
  }

  fetchCaptcha()

  return () => {
    cancelled = true
  }
}, [])

  async function onSubmit(values) {
    setLoginError('')

    try {
      const { data } = await api.post('/api/auth/login', {
        username: values.username,
        password: values.password,
        salt: captcha.salt,
        captcha_answer: values.captcha_answer,
      })

      if (!data?.access_token) {
        throw new Error('پاسخ ورود فاقد access token است.')
      }

      setAccessToken(data.access_token)
      onLogin(data)
    } catch (error) {
      clearAccessToken()
      setLoginError(
        error.response
          ? getErrorMessage(error)
          : error.message || getErrorMessage(error),
      )
      reset({
        username: values.username,
        password: '',
        captcha_answer: '',
      })
      await loadCaptcha()
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          <LockKeyhole size={25} />
        </div>

        <p className="eyebrow">IDICORP · SERVICE CONSOLE</p>
        <h1 id="login-title">خوش آمدید</h1>
        <p className="login-description">
          برای دسترسی به پنل خدمات، وارد حساب خود شوید.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="username">نام کاربری</label>
            <input
              id="username"
              autoComplete="username"
              placeholder="نام کاربری خود را وارد کنید"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              {...register('username')}
            />
            {errors.username && (
              <p id="username-error" className="field-error">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">رمز عبور</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="رمز عبور خود را وارد کنید"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="field-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="captcha_answer">کد امنیتی</label>

            {captchaLoading ? (
              <div className="captcha-placeholder" role="status">
                در حال دریافت کپچا...
              </div>
            ) : captcha?.captcha ? (
              <div className="captcha-image-wrap">
                <img
                  src={captcha.captcha}
                  alt="تصویر کد امنیتی"
                  className="captcha-image"
                />
                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => loadCaptcha()}
                  disabled={isSubmitting}
                  aria-label="دریافت کپچای جدید"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            ) : (
              <div className="captcha-placeholder" role="status">
                {captchaError || 'تصویر کپچا در دسترس نیست.'}
                <button type="button" onClick={loadCaptcha}>
                  تلاش دوباره
                </button>
              </div>
            )}

            <input
              id="captcha_answer"
              autoComplete="off"
              placeholder="متن داخل تصویر را وارد کنید"
              aria-invalid={Boolean(errors.captcha_answer)}
              aria-describedby={
                errors.captcha_answer ? 'captcha-error' : undefined
              }
              {...register('captcha_answer')}
            />
            {errors.captcha_answer && (
              <p id="captcha-error" className="field-error">
                {errors.captcha_answer.message}
              </p>
            )}
          </div>

          {loginError && (
            <p className="form-error" role="alert">
              {loginError}
            </p>
          )}

          <button
            className="submit-button"
            type="submit"
            disabled={isSubmitting || captchaLoading || !captcha}
          >
            {isSubmitting ? 'در حال ورود...' : 'ورود به پنل'}
          </button>
        </form>

        <p className="login-footer">
          دسترسی امن به سرویس‌های IDICorp
        </p>
      </section>
    </main>
  )
}
