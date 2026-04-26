import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export function useAuth() {
  const { user, setAuth, logout } = useAuthStore();

  const login = async (email: string, password: string, captchaToken: string) => {
    const { data } = await api.post('/auth/login', { email, password, captchaToken });
    setAuth(data.data.user, data.data.accessToken);
    return data.data;
  };

  const logoutFn = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
  };

  return { user, login, logout: logoutFn, isAdmin: user?.role === 'ADMIN' };
}
