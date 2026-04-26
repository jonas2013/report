import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export function usePermission(projectId?: string) {
  const user = useAuthStore((s) => s.user);
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    if (!projectId || !user) return;
    api.get(`/projects/${projectId}`).then((r) => {
      const member = (r.data.data.members as any[])?.find((m: any) => m.userId === user.id);
      setMembership(member || null);
    }).catch(() => setMembership(null));
  }, [projectId, user]);

  return {
    isAdmin: user?.role === 'ADMIN',
    isProjectOwner: user?.role === 'ADMIN' || membership?.role === 'OWNER',
    canEditReport: (reportUserId: string) => user?.role === 'ADMIN' || user?.id === reportUserId,
    canViewAllReports: user?.role === 'ADMIN' || membership?.role === 'OWNER',
    canManageMembers: user?.role === 'ADMIN' || membership?.role === 'OWNER',
  };
}
