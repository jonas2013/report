import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    api.get('/reports/my?limit=50' + (filterProject ? `&projectId=${filterProject}` : '')).then((r) => setReports(r.data.data.data));
  }, [filterProject]);

  useEffect(() => {
    api.get('/projects?limit=100').then((r) => setProjects(r.data.data.data));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-2xl font-bold text-on-surface">我的日报</h1>
        <Link
          to="/reports/write"
          className="bg-secondary text-on-secondary px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          填写日报
        </Link>
      </div>

      <div className="mb-md">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary"
        >
          <option value="">全部项目</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                    {r.status === 'SUBMITTED' ? '已提交' : '草稿'}
                  </span>
                </div>
                <div className="text-sm text-on-surface-variant truncate">{r.todayDone || '无摘要'}</div>
              </div>
              <div className="text-sm text-on-surface-variant">
                {new Date(r.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </div>
              {r.hours && <div className="text-xs text-on-surface-variant">{r.hours}h</div>}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
