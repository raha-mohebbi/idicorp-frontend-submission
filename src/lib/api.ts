import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  CaptchaData,
  LoginPayload,
  LoginResponse,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilterParams,
  ApiErrorData,
} from '../types';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isAuthenticated,
  onAuthStateChange,
} from '../store/useAuthStore';

// Re-export auth helpers so existing imports remain backward-compatible
export {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isAuthenticated,
  onAuthStateChange,
};

/**
 * Base URL for HTTP requests.
 * Uses the environment variable VITE_API_BASE_URL if set, or empty string to use relative proxy paths in dev.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Shared Axios instance configured for IDICorp API.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: attach Authorization: Bearer <token>
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && isAuthenticated()) {
      clearAccessToken();
    }
    return Promise.reject(error);
  }
);

/**
 * Converts any API error, AxiosError, or network failure into a human-readable Persian message.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'خطای نامشخصی رخ داده است.';

  if (typeof error === 'string') return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        return 'ارتباط با سرور برقرار نشد. لطفاً وضعیت اینترنت، آدرس سرور یا تنظیمات CORS را بررسی کنید.';
      }
      return error.message || 'ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.';
    }

    const { status, data } = error.response as { status: number; data: ApiErrorData | undefined };

    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (status === 401) {
      return 'نشست ورود معتبر نیست یا منقضی شده است. لطفاً دوباره وارد شوید.';
    }

    if (status === 403) {
      return 'اجازه دسترسی به این سرویس را ندارید.';
    }

    if (status === 404) {
      return 'سرویس یا مسیر درخواستی پیدا نشد.';
    }

    if (status === 422) {
      if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const firstError = data.detail[0];
        return firstError?.msg
          ? `اطلاعات ارسال‌شده معتبر نیست: ${firstError.msg}`
          : 'اطلاعات ارسال‌شده معتبر نیست.';
      }
      return 'اطلاعات ارسال‌شده معتبر نیست. لطفاً فیلدها را بررسی کنید.';
    }

    if (status === 429) {
      return 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.';
    }

    if (status >= 500) {
      return 'خطایی در سرویس رخ داده است. لطفاً بعداً دوباره تلاش کنید.';
    }

    return 'درخواست ناموفق بود. دوباره تلاش کنید.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'خطای ناشناخته رخ داده است.';
}

// ==========================================
// Typed API Services
// ==========================================

export const authApi = {
  /**
   * Fetches CAPTCHA image and salt
   */
  async getCaptcha(): Promise<CaptchaData> {
    const { data } = await api.get<CaptchaData>('/api/auth/login', {
      params: { _t: Date.now() },
    });

    if (!data?.captcha?.startsWith('data:image/') || !data?.salt) {
      throw new Error('پاسخ دریافتی کد امنیتی معتبر نیست.');
    }

    return data;
  },

  /**
   * Submits login credentials and receives access token
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/api/auth/login', payload);

    if (!data?.access_token) {
      throw new Error('ورود موفق بود، اما توکن در پاسخ دریافت نشد.');
    }

    return data;
  },
};

export const tasksApi = {
  /**
   * Retrieves sample tasks with optional search and completion filter
   */
  async getTasks(params?: TaskFilterParams): Promise<Task[]> {
    const { data } = await api.get<Task[]>('/api/tasks', { params });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Retrieves a single task by ID
   */
  async getTaskById(id: number): Promise<Task> {
    const { data } = await api.get<Task>(`/api/tasks/${id}`);
    return data;
  },

  /**
   * Creates a new task (201 Created)
   */
  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>('/api/tasks', payload);
    return data;
  },

  /**
   * Replaces a task (PUT)
   */
  async replaceTask(id: number, payload: Required<CreateTaskPayload>): Promise<Task> {
    const { data } = await api.put<Task>(`/api/tasks/${id}`, payload);
    return data;
  },

  /**
   * Partially updates a task (PATCH)
   */
  async updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await api.patch<Task>(`/api/tasks/${id}`, payload);
    return data;
  },

  /**
   * Deletes a task by ID (204 No Content)
   */
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },
};

export const echoApi = {
  /**
   * Streams text to POST /api/echo/stream and returns response body reader
   */
  async streamEcho(
    text: string,
    options?: { signal?: AbortSignal }
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const token = getAccessToken();
    if (!token) {
      throw new Error('توکن ورود در دسترس نیست. ابتدا وارد حساب کاربری شوید.');
    }

    const streamUrl = `${API_BASE_URL}/api/echo/stream`;
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: text,
      signal: options?.signal,
    });

    if (!response.ok) {
      let message = '';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          message = data?.detail || data?.message || '';
        } else {
          message = (await response.text()).slice(0, 300);
        }
      } catch {
        // Ignore fallback
      }

      if (response.status === 401) {
        clearAccessToken();
        throw new Error('نشست ورود منقضی شده است. لطفاً دوباره وارد شوید.');
      }
      if (response.status === 403) throw new Error('اجازه دسترسی به این سرویس وجود ندارد.');
      if (response.status === 404) throw new Error('مسیر سرویس Streaming پیدا نشد.');
      if (response.status === 422) throw new Error(message || 'متن یا قالب درخواست پذیرفته نشد.');
      if (response.status >= 500) throw new Error(message || 'خطایی در سرویس رخ داده است.');

      throw new Error(message || `درخواست ناموفق بود (${response.status}).`);
    }

    if (!response.body) {
      throw new Error('بدنه پاسخ استریم در دسترس نیست.');
    }

    return response.body.getReader();
  },
};
