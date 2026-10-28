
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const TOKEN_KEY = "idicorp_access_token";

let accessToken = null;

try {
  accessToken = sessionStorage.getItem(TOKEN_KEY);
} catch {
  accessToken = null;
}

export function setAccessToken(token) {
  accessToken = typeof token === "string" && token ? token : null;

  try {
    if (accessToken) {
      sessionStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // اگر sessionStorage در دسترس نباشد، توکن فقط در حافظه می‌ماند.
  }
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  setAccessToken(null);
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export function getErrorMessage(error) {
  if (!error.response) {
    return "ارتباط با سرور برقرار نشد. اتصال شبکه و تنظیمات CORS را بررسی کنید.";
  }

  const { status, data } = error.response;

  if (status === 401) {
    return "نشست ورود معتبر نیست یا منقضی شده است. دوباره وارد شوید.";
  }

  if (status === 403) {
    return "اجازه دسترسی به این سرویس را ندارید.";
  }

  if (status === 404) {
    return "سرویس یا مسیر درخواستی پیدا نشد.";
  }

  if (status === 422) {
    return "اطلاعات ارسال‌شده معتبر نیست.";
  }

  if (status === 429) {
    return "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.";
  }

  if (status >= 500) {
    return "خطایی در سرویس رخ داده است. لطفاً بعداً دوباره تلاش کنید.";
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  return "درخواست ناموفق بود. دوباره تلاش کنید.";
}
