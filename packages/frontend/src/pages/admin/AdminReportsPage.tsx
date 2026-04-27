import { useEffect, useState } from 'react';
import api from '../../services/api';

export function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/projects?limit=100').then((r) => setProjects(r.data.data.data));
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setReports([]);
      setMembers([]);
      return;
    }
    api.get(`/projects/${selectedProject}/members`).then((r) => setMembers(r.data.data));
    loadReports();
  }, [selectedProject, filterStatus, filterMember]);

  const loadReports = async () => {
    if (!selectedProject) return;
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (filterStatus) params.set('status', filterStatus);
    if (filterMember) params.set('userId', filterMember);
    const { data } = await api.get(`/reports/${selectedProject}?${params}`);
    setReports(data.data.data);
  };

  // Group by date
  const grouped = reports.reduce((acc: Record<string, any[]>, r: any) => {
    const key = new Date(r.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const projectName = projects.find((p) => p.id === selectedProject)?.name;

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-lg">日报查看</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-sm mb-lg">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border border-outline-variant rounded h-10 px-3 text-sm bg-white min-w-[200px] focus:outline-none focus:border-secondary"
        >
          <option value="">选择项目...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedProject && (
          <>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary">
              <option value="">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="SUBMITTED">已提交</option>
            </select>
            <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary">
              <option value="">全部成员</option>
              {members.map((m: any) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {!selectedProject ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-sm block">description</span>
          <div>请选择一个项目查看日报</div>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-sm block">inbox</span>
          <div>该项目暂无日报</div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-lg">
            <div className="flex items-center gap-sm mb-sm">
              <span className="text-sm font-semibold text-on-surface-variant">{date}</span>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{items.length} 份</span>
            </div>
            <div className="space-y-sm">
              {items.map((r: any) => {
                const isExpanded = expandedId === r.id;
                return (
                  <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                    {/* Header row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="w-full text-left p-md flex items-center gap-md hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-semibold shrink-0">
                        {r.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          <span className="text-sm font-medium">{r.user.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                            {r.status === 'SUBMITTED' ? '已提交' : '草稿'}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5 truncate">
                          {r.todayDone || r.content?.replace(/<[^>]+>/g, '').slice(0, 80) || '无内容'}
                        </div>
                      </div>
                      <div className="flex items-center gap-sm shrink-0">
                        {r.hours != null && <span className="text-xs text-on-surface-variant">{r.hours}h</span>}
                        {r.progress != null && <span className="text-xs text-on-surface-variant">{r.progress}%</span>}
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-outline-variant p-md bg-surface-container-low">
                        {r.content && (
                          <div className="mb-md">
                            <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">工作内容</div>
                            <div className="text-sm text-on-surface prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: r.content }} />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-md text-sm">
                          {r.tomorrowPlan && (
                            <div>
                              <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">明日计划</div>
                              <div className="text-on-surface">{r.tomorrowPlan}</div>
                            </div>
                          )}
                          {r.blockers && (
                            <div>
                              <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-danger">warning</span>
                                阻碍/风险
                              </div>
                              <div className="text-on-surface">{r.blockers}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
