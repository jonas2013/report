import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'auth-storage';

function loadState(): Pick<AuthState, 'user' | 'accessToken'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { user: parsed.user || null, accessToken: parsed.accessToken || null };
    }
  } catch { /* ignore */ }
  return { user: null, accessToken: null };
}

function saveState(user: User | null, accessToken: string | null) {
  if (user && accessToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const initial = loadState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  setAuth: (user, token) => {
    set({ user, accessToken: token });
    saveState(user, token);
  },
  setAccessToken: (token) => {
    set({ accessToken: token });
    saveState(get().user, token);
  },
  logout: () => {
    set({ user: null, accessToken: null });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
