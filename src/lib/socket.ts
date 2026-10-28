/**
 * WebSocket Management Module
 * IDICorp Service Console
 *
 * Implements robust WebSocket connection handling with protocol-compliant
 * authentication as documented in ASSIGNMENT.md:
 * - Calculator: Handshake followed by in-band JSON {"token": "<access_token>"} within 1 second.
 * - Echo: Plain connection receiving {"type": "ready"}, followed by bidirectional text frames.
 */

import { getAccessToken } from './api';
import {
  CalculatorOperation,
  CalculatorRequestPayload,
  CalculatorServerMessage,
  WebSocketOptions,
} from '../types';

/**
 * Resolves a WebSocket URL based on current environment and endpoint path.
 *
 * @param endpoint - Relative path (e.g. '/ws/calculator') or complete URL ('wss://...')
 * @param token - Optional token for dev proxy handshake forwarding
 */
export function getWebSocketUrl(endpoint: string, token?: string | null): string {
  let url = endpoint;

  if (!endpoint.startsWith('ws://') && !endpoint.startsWith('wss://')) {
    const isDev = import.meta.env.DEV;
    const baseApi = import.meta.env.VITE_API_BASE_URL as string | undefined;

    if (isDev || !baseApi) {
      // Connect to local Vite development proxy
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
      url = `${protocol}//${host}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    } else {
      // Connect to production backend URL directly
      const wsBase = baseApi.replace(/^http/, 'ws');
      url = `${wsBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
  }

  // Attach token parameter for Vite dev proxy handshake bridge if in dev environment
  if (token && typeof window !== 'undefined' && (url.includes(window.location.host) || import.meta.env.DEV)) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  return url;
}

/**
 * Creates an authenticated or standard WebSocket connection.
 * Supports WHATWG browser WebSockets with event listener registration and inspection metadata.
 */
export function createWebSocket(
  endpoint: string,
  options: WebSocketOptions = {}
): WebSocket {
  const token = options.headers?.Authorization
    ? options.headers.Authorization.replace(/^Bearer\s+/i, '')
    : getAccessToken();

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const resolvedUrl = getWebSocketUrl(endpoint, token);

  let socket: WebSocket;

  try {
    if (typeof window === 'undefined') {
      // Node.js or SSR environment with ws package headers support
      const NodeWebSocket = (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket;
      socket = new (NodeWebSocket as unknown as {
        new (url: string, opts?: { headers?: Record<string, string> }): WebSocket;
      })(resolvedUrl, { headers });
    } else {
      // Standard browser WebSocket constructor
      socket = options.protocols
        ? new WebSocket(resolvedUrl, options.protocols)
        : new WebSocket(resolvedUrl);
    }
  } catch (err) {
    if (options.onError && err instanceof Event) {
      options.onError(err);
    }
    throw err;
  }

  if (options.onOpen) {
    if (socket.readyState === WebSocket.OPEN) {
      const openCallback = options.onOpen;
      queueMicrotask(() => openCallback(new Event('open')));
    } else {
      socket.addEventListener('open', options.onOpen);
    }
  }

  if (options.onMessage) {
    socket.addEventListener('message', (event) => {
      let parsed: unknown = event.data;
      if (typeof event.data === 'string') {
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = event.data;
        }
      }
      options.onMessage?.(parsed, event);
    });
  }

  if (options.onError) {
    socket.addEventListener('error', options.onError);
  }

  if (options.onClose) {
    socket.addEventListener('close', options.onClose);
  }

  // Attach debug metadata to socket instance
  (socket as unknown as { __authHeaders?: Record<string, string> }).__authHeaders = headers;

  return socket;
}

/**
 * High-Level Calculator Service
 * Executes a single calculator operation through WebSocket in full compliance with ASSIGNMENT.md:
 * 1. Connects to /ws/calculator
 * 2. Transmits {"token": "<access_token>"} within 1 second
 * 3. Awaits {"type": "ready"}
 * 4. Transmits calculation payload {"operation": ..., "numbers": [...]}
 * 5. Returns numeric result or rejects with descriptive error
 */
export async function executeCalculatorRequest(params: {
  operation: CalculatorOperation;
  numbers: number[];
  token?: string | null;
  timeoutMs?: number;
}): Promise<number> {
  const { operation, numbers, timeoutMs = 10000 } = params;
  const token = params.token ?? getAccessToken();

  if (!token) {
    throw new Error('توکن ورود در دسترس نیست. لطفاً مجدداً وارد سیستم شوید.');
  }

  return new Promise((resolve, reject) => {
    let socket: WebSocket;
    let isFinished = false;
    let isAuthenticated = false;

    const timeoutId = window.setTimeout(() => {
      finishWithError('زمان انتظار برای دریافت پاسخ از سرویس ماشین‌حساب به پایان رسید.');
    }, timeoutMs);

    function cleanup(): void {
      window.clearTimeout(timeoutId);
      isFinished = true;
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
      ) {
        socket.close();
      }
    }

    function finishWithError(message: string): void {
      if (isFinished) return;
      cleanup();
      reject(new Error(message));
    }

    try {
      socket = createWebSocket('/ws/calculator', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      window.clearTimeout(timeoutId);
      reject(new Error('ساخت اتصال WebSocket با ماشین‌حساب ناموفق بود.'));
      return;
    }

    socket.onopen = () => {
      try {
        // Send access token within 1 second of opening
        socket.send(JSON.stringify({ token }));
      } catch {
        finishWithError('ارسال توکن احراز هویت به سرویس ماشین‌حساب ناموفق بود.');
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      if (isFinished) return;

      let data: CalculatorServerMessage;
      try {
        data = JSON.parse(event.data);
      } catch {
        finishWithError('پاسخ نامعتبر از سرویس ماشین‌حساب دریافت شد.');
        return;
      }

      if (!isAuthenticated) {
        if ('type' in data && data.type === 'ready') {
          isAuthenticated = true;
          // Send operation payload
          const payload: CalculatorRequestPayload = { operation, numbers };
          socket.send(JSON.stringify(payload));
          return;
        }

        if ('error' in data || ('type' in data && data.type === 'error')) {
          const rawErr = (data as { error?: unknown; message?: unknown });
          const err =
            typeof rawErr.message === 'string'
              ? rawErr.message
              : typeof rawErr.error === 'string'
              ? rawErr.error
              : 'خطای احراز هویت سرویس ماشین‌حساب.';
          finishWithError(err);
          return;
        }
      }

      // Check for errors after ready
      if ('error' in data && data.error) {
        const rawErr = (data as { error?: unknown; message?: unknown });
        const err =
          typeof rawErr.message === 'string'
            ? rawErr.message
            : typeof rawErr.error === 'string'
            ? rawErr.error
            : 'خطا در انجام محاسبه.';
        finishWithError(err);
        return;
      }

      // Extract result
      const result =
        'result' in data
          ? data.result
          : 'value' in data
          ? data.value
          : 'output' in data
          ? data.output
          : undefined;

      if (typeof result === 'number' && Number.isFinite(result)) {
        cleanup();
        resolve(result);
      } else {
        finishWithError('پاسخ سرور فاقد نتیجه عددی معتبر است.');
      }
    };

    socket.onerror = () => {
      finishWithError('ارتباط WebSocket با خطای شبکه مواجه شد.');
    };

    socket.onclose = (event: CloseEvent) => {
      if (isFinished) return;
      if (!isAuthenticated) {
        finishWithError('اتصال پیش از تأیید توکن احراز هویت توسط سرور بسته شد.');
      } else if (event.code === 1008) {
        finishWithError('سرور دسترسی به این درخواست را نامعتبر تشخیص داد.');
      } else {
        finishWithError('اتصال پیش از دریافت نتیجه محاسبه قطع شد.');
      }
    };
  });
}
