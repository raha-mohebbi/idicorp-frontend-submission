
import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_BASE_URL || 'https://ts.idicorp.ir'
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export function getErrorMessage(error) {
  if (!error.response) {
    return 'اتصال به سرور برقرار نشد. اینترنت یا دسترسی به سرویس را بررسی کنید.'
  }

  const { status, data } = error.response

  if (status === 401) {
    return 'اطلاعات ورود معتبر نیست یا نشست شما منقضی شده است.'
  }

  if (status === 422) {
    return 'اطلاعات ارسال‌شده معتبر نیست. فیلدها را بررسی کنید.'
  }

  if (status === 429) {
    return 'تعداد درخواست‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.'
  }

  if (status >= 500) {
    return 'خطایی در سرویس رخ داده است. لطفاً بعداً دوباره تلاش کنید.'
  }

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  return 'درخواست ناموفق بود. دوباره تلاش کنید.'
}
