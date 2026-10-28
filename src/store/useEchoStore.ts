import { create } from 'zustand';
import { EchoMessage } from '../types';
import { createWebSocket } from '../lib/socket';
import { getAccessToken } from '../lib/api';

interface EchoState {
  messages: EchoMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  socketInstance: WebSocket | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => boolean;
  addMessage: (kind: 'sent' | 'received' | 'system', text: string) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useEchoStore = create<EchoState>((set, get) => ({
  messages: [],
  isConnected: false,
  isConnecting: false,
  error: null,
  socketInstance: null,

  clearError: () => set({ error: null }),

  addMessage: (kind, text) => {
    const newMessage: EchoMessage = {
      id: crypto.randomUUID(),
      kind,
      text,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  connect: () => {
    const { socketInstance, isConnected, isConnecting } = get();
    if (isConnected || isConnecting) return;

    if (
      socketInstance &&
      (socketInstance.readyState === WebSocket.OPEN ||
        socketInstance.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      set({ error: 'توکن ورود پیدا نشد. ابتدا وارد حساب کاربری شوید.' });
      return;
    }

    set({ isConnecting: true, error: null });

    let socket: WebSocket;
    try {
      socket = createWebSocket('/ws/echo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ socketInstance: socket });
    } catch {
      set({ isConnecting: false, error: 'ایجاد اتصال WebSocket ناموفق بود.' });
      return;
    }

    socket.onopen = () => {
      set({ isConnecting: false, isConnected: true });
      get().addMessage('system', 'اتصال WebSocket به سرویس Echo برقرار شد.');
    };

    socket.onmessage = (event: MessageEvent) => {
      let text = event.data;
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'ready') {
            get().addMessage('system', 'سرویس Echo آماده دریافت پیام است.');
            return;
          }
          if (parsed.type === 'error' || parsed.error) {
            set({ error: parsed.message || parsed.error || 'خطایی در سرویس Echo رخ داد.' });
            return;
          }
          if (typeof parsed.message === 'string') {
            text = parsed.message;
          } else if (parsed.type === 'echo' && 'data' in parsed) {
            text = String(parsed.data);
          } else {
            text = JSON.stringify(parsed, null, 2);
          }
        } catch {
          // Plain text message
        }
      }
      get().addMessage('received', String(text));
    };

    socket.onerror = () => {
      set({ error: 'ارتباط WebSocket با خطا مواجه شد.' });
    };

    socket.onclose = () => {
      set({ isConnected: false, isConnecting: false, socketInstance: null });
      get().addMessage('system', 'اتصال WebSocket قطع شد.');
    };
  },

  disconnect: () => {
    const { socketInstance } = get();
    if (socketInstance) {
      socketInstance.close();
    }
    set({ socketInstance: null, isConnected: false, isConnecting: false });
  },

  sendMessage: (text: string) => {
    const { socketInstance, isConnected } = get();
    if (!isConnected || !socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
      set({ error: 'ارتباط WebSocket فعال نیست.' });
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) return false;

    try {
      socketInstance.send(trimmed);
      get().addMessage('sent', trimmed);
      return true;
    } catch {
      set({ error: 'ارسال پیام ناموفق بود.' });
      return false;
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
