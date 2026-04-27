import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export function ProjectListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);

  const loadProjects = () => {
    api.get('/projects?limit=100').then((r) => setProjects(r.data.data.data));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确认归档该项目？')) return;
    await api.delete(`/projects/${id}`);
    loadProjects();
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-2xl font-bold text-on-surface">项目管理</h1>
        <Link
          to="/projects/new"
          className="bg-secondary text-on-secondary px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          创建项目
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {projects.map((p) => {
          const canManage = user?.role === 'ADMIN' || p.owner.id === user?.id;
          return (
            <div
              key={p.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg hover:border-secondary/40 transition-colors relative group"
            >
              <div className="flex items-start justify-between mb-sm">
                <Link to={`/projects/${p.id}`} className="font-semibold text-on-surface hover:text-secondary">
                  {p.name}
                </Link>
                <span className={statusBadge(p.status)}>{statusLabel(p.status)}</span>
              </div>
              {p.description && <p className="text-sm text-on-surface-variant mb-md line-clamp-2">{p.description.replace(/<[^>]+>/g, '')}</p>}
              <div className="flex items-center gap-md text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {p._count.members} 人
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">description</span>
                  {p._count.reports} 份日报
                </span>
              </div>
              <div className="text-xs text-on-surface-variant mt-sm">负责人：{p.owner.name}</div>

              {canManage && (
                <div className="flex items-center gap-sm mt-md pt-sm border-t border-outline-variant">
                  <Link
                    to={`/projects/${p.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    编辑
                  </Link>
                  <Link
                    to={`/projects/${p.id}/reports`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    日报
                  </Link>
                  <button
                    onClick={(e) => handleArchive(e, p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-danger/40 rounded bg-danger/5 text-danger hover:bg-danger/10 transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-[14px]">archive</span>
                    归档
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    ACTIVE: 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800',
    PAUSED: 'text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800',
    ARCHIVED: 'text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600',
    COMPLETED: 'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800',
  };
  return map[s] || map.ACTIVE;
}

function statusLabel(s: string) {
  return { ACTIVE: '进行中', PAUSED: '暂停', ARCHIVED: '已归档', COMPLETED: '已完成' }[s] || s;
}
