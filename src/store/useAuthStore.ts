import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  authError: string | null;

  // Actions
  setToken: (token: string | null, username?: string) => void;
  login: (token: string, username?: string) => void;
  logout: () => void;
  setCheckingAuth: (isChecking: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      isAuthenticated: false,
      isCheckingAuth: false,
      authError: null,

      setToken: (token, username) => {
        const cleanToken = typeof token === 'string' && token.trim() ? token.trim() : null;
        set({
          token: cleanToken,
          isAuthenticated: Boolean(cleanToken),
          username: cleanToken ? (username ?? get().username) : null,
          authError: null,
        });
      },

      login: (token, username) => {
        const cleanToken = typeof token === 'string' && token.trim() ? token.trim() : null;
        set({
          token: cleanToken,
          username: username || 'admin',
          isAuthenticated: Boolean(cleanToken),
          authError: null,
        });
      },

      logout: () => {
        set({
          token: null,
          username: null,
          isAuthenticated: false,
          authError: null,
        });
      },

      setCheckingAuth: (isCheckingAuth) => set({ isCheckingAuth }),
      setAuthError: (authError) => set({ authError }),
    }),
    {
      name: 'idicorp_auth_session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Access token getter for non-React contexts (e.g. Axios interceptor, WebSocket helpers)
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Convenience setter for non-React contexts
 */
export function setAccessToken(token: string | null): void {
  useAuthStore.getState().setToken(token);
}

/**
 * Convenience clearer for non-React contexts
 */
export function clearAccessToken(): void {
  useAuthStore.getState().logout();
}

/**
 * Authentication check for non-React contexts
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

/**
 * Subscribes to authentication state changes for non-React callers
 */
export function onAuthStateChange(
  callback: (isAuthenticated: boolean, token: string | null) => void
): () => void {
  return useAuthStore.subscribe((state, prevState) => {
    if (state.isAuthenticated !== prevState.isAuthenticated || state.token !== prevState.token) {
      callback(state.isAuthenticated, state.token);
    }
  });
}
