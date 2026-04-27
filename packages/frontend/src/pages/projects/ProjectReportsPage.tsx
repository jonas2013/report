import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export function ProjectReportsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMember, setFilterMember] = useState('');

  const isOwner = user?.role === 'ADMIN';

  useEffect(() => {
    api.get(`/projects/${id}/members`).then((r) => {
      setMembers(r.data.data);
      const member = r.data.data.find((m: any) => m.userId === user?.id);
      if (member?.role === 'OWNER' || user?.role === 'ADMIN') {
        setIsOwner(true);
      }
    });
  }, [id]);

  const [isOwnerState, setIsOwner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterMember) params.set('userId', filterMember);
    params.set('limit', '50');
    api.get(`/reports/${id}?${params}`).then((r) => setReports(r.data.data.data));
  }, [id, filterStatus, filterMember]);

  // Group by date
  const grouped = reports.reduce((acc: any, r: any) => {
    const dateKey = new Date(r.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-md">
        <div className="flex gap-sm">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-outline-variant rounded h-9 px-3 text-sm bg-white">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="SUBMITTED">已提交</option>
          </select>
          {isOwnerState && (
            <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="border border-outline-variant rounded h-9 px-3 text-sm bg-white">
              <option value="">全部成员</option>
              {members.map((m: any) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          )}
        </div>
        <Link to={`/projects/${id}/reports/write`} className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90">
          <span className="material-symbols-outlined text-sm">add</span>
          写日报
        </Link>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-sm">inbox</span>
          <div>暂无日报</div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]: [string, any]) => (
          <div key={date} className="mb-lg">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-sm">{date}</h3>
            <div className="space-y-sm">
              {items.map((r: any) => (
                <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md hover:border-secondary/30 transition-colors">
                  <div className="flex items-center gap-sm mb-1">
                    <div className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-[10px] font-semibold">
                      {r.user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{r.user.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                      {r.status === 'SUBMITTED' ? '已提交' : '草稿'}
                    </span>
                    {r.hours && <span className="text-xs text-on-surface-variant">{r.hours}h</span>}
                  </div>
                  <div className="text-sm text-on-surface-variant line-clamp-2">{r.todayDone || r.content?.replace(/<[^>]+>/g, '').slice(0, 100)}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
