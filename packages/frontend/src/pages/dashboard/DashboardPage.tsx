import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface TodayStatus {
  projects: { id: string; name: string; hasReport: boolean; status: string | null }[];
}

interface Project {
  id: string;
  name: string;
  status: string;
  owner: { id: string; name: string; avatar?: string };
  _count: { members: number; reports: number };
}

interface RecentReport {
  id: string;
  date: string;
  todayDone: string;
  status: string;
  project: { id: string; name: string };
}

export function DashboardPage() {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/reports/my/today').then((r) => r.data.data).catch(() => null),
      api.get('/projects?limit=10').then((r) => r.data.data.data).catch(() => []),
      api.get('/reports/my?limit=5').then((r) => r.data.data.data).catch(() => []),
    ]).then(([today, projs, reps]) => {
      if (today) setTodayStatus(today);
      setProjects(projs as Project[]);
      setReports(reps as RecentReport[]);
    });
  }, []);

  const unfilled = todayStatus?.projects.filter((p) => !p.hasReport) || [];
  const draftProjects = todayStatus?.projects.filter((p) => p.status === 'DRAFT') || [];

  return (
    <div className="max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-lg">
        {user?.name}，{getGreeting()}
      </h1>

      {/* Today reminder */}
      {(unfilled.length > 0 || draftProjects.length > 0) && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
          <h2 className="text-lg font-semibold text-on-surface mb-md">今日待办</h2>
          {unfilled.length > 0 && (
            <div className="bg-error-container/30 border border-error/20 rounded-lg p-md mb-sm">
              <div className="flex items-center gap-2 text-danger font-medium mb-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                还有 {unfilled.length} 个项目未填写日报
              </div>
              <div className="flex gap-sm flex-wrap">
                {unfilled.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}/reports/write`}
                    className="text-sm bg-white border border-outline-variant px-3 py-1 rounded-full hover:bg-surface-container-low transition-colors"
                  >
                    {p.name} → 去填写
                  </Link>
                ))}
              </div>
            </div>
          )}
          {draftProjects.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-md">
              <div className="flex items-center gap-2 text-warning font-medium mb-1">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                {draftProjects.length} 个草稿未提交
              </div>
              <div className="flex gap-sm flex-wrap">
                {draftProjects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}/reports`}
                    className="text-sm bg-white border border-outline-variant px-3 py-1 rounded-full hover:bg-surface-container-low transition-colors"
                  >
                    {p.name} → 去提交
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects grid */}
      <h2 className="text-lg font-semibold text-on-surface mb-md">我的项目</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-lg">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md hover:border-secondary/40 transition-colors"
          >
            <div className="flex items-start justify-between mb-sm">
              <h3 className="font-semibold text-on-surface">{p.name}</h3>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full border', statusStyle(p.status))}>
                {statusLabel(p.status)}
              </span>
            </div>
            <div className="flex items-center gap-md text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person</span>
                {p._count.members} 人
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">description</span>
                {p._count.reports} 份
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-sm">负责人：{p.owner.name}</div>
          </Link>
        ))}
      </div>

      {/* Recent reports */}
      <h2 className="text-lg font-semibold text-on-surface mb-md">最近日报</h2>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-sm">inbox</span>
            <div>暂无日报记录</div>
          </div>
        ) : (
          reports.map((r) => (
            <Link
              key={r.id}
              to={`/projects/${r.project.id}/reports`}
              className="flex items-center gap-md p-md border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm mb-1">
                  <span className="font-medium text-on-surface">{r.project.name}</span>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full', r.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600')}>
                    {r.status === 'SUBMITTED' ? '已提交' : '草稿'}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant truncate">{r.todayDone || '无摘要'}</div>
              </div>
              <div className="text-xs text-on-surface-variant">{formatDate(r.date)}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '上午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function statusStyle(s: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return map[s] || map.ACTIVE;
}

function statusLabel(s: string) {
  const map: Record<string, string> = { ACTIVE: '进行中', PAUSED: '暂停', ARCHIVED: '已归档', COMPLETED: '已完成' };
  return map[s] || s;
}

function clsx(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(' ');
}
