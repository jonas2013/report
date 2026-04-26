import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'ADMIN' }) {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    // Validate stored token with backend
    api.get('/auth/me')
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (!ready) {
    return <div className="h-screen flex items-center justify-center text-on-surface-variant text-sm">验证中...</div>;
  }
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
