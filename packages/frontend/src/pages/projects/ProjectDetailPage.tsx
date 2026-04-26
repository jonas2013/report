import { useEffect, useState } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { RichTextEditor, RichTextViewer } from '../../components/Common/RichTextEditor';

export function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'ACTIVE', startDate: '', endDate: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addUserId, setAddUserId] = useState('');
  const [memberError, setMemberError] = useState('');

  const loadProject = () => {
    if (id) api.get(`/projects/${id}`).then((r) => {
      const p = r.data.data;
      setProject(p);
      setForm({
        name: p.name,
        description: p.description || '',
        status: p.status,
        startDate: p.startDate ? p.startDate.split('T')[0] : '',
        endDate: p.endDate ? p.endDate.split('T')[0] : '',
      });
    });
  };

  useEffect(() => { loadProject(); }, [id]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/reports')) setActiveTab('reports');
    else if (path.includes('/stats')) setActiveTab('stats');
    else if (path.includes('/settings')) setActiveTab('settings');
    else setActiveTab('overview');
  }, [location]);

  if (!project) return <div className="p-xl text-center text-on-surface-variant">加载中...</div>;

  const isOwner = user?.role === 'ADMIN' || project.owner.id === user?.id;

  const tabs = [
    { key: 'overview', label: '概览', to: `/projects/${id}` },
    { key: 'reports', label: '日报', to: `/projects/${id}/reports` },
    ...(isOwner ? [{ key: 'stats', label: '统计', to: `/projects/${id}/stats` }] : []),
    ...(isOwner ? [{ key: 'settings', label: '设置', to: `/projects/${id}/settings` }] : []),
  ];

  const handleSaveInfo = async () => {
    setError('');
    try {
      await api.put(`/projects/${id}`, {
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      if (form.status !== project.status) {
        await api.put(`/projects/${id}/status`, { status: form.status });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
      loadProject();
    } catch (e: any) {
      setError(e.response?.data?.error || '保存失败');
    }
  };

  const loadAllUsers = async () => {
    if (user?.role === 'ADMIN') {
      const { data } = await api.get('/users?limit=100');
      setAllUsers(data.data.data);
    }
  };

  const handleAddMember = async () => {
    if (!addUserId) return;
    setMemberError('');
    try {
      await api.post(`/projects/${id}/members`, { userId: addUserId });
      setAddUserId('');
      loadProject();
    } catch (e: any) {
      setMemberError(e.response?.data?.error || '添加失败');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    await api.delete(`/projects/${id}/members/${userId}`);
    loadProject();
  };

  const handleChangeRole = async (userId: string, role: string) => {
    await api.put(`/projects/${id}/members/${userId}/role`, { role });
    loadProject();
  };

  const memberIds = new Set(project.members.map((m: any) => m.userId));
  const availableUsers = allUsers.filter((u: any) => !memberIds.has(u.id) && u.isActive);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-lg">
        <h1 className="text-2xl font-bold text-on-surface">{project.name}</h1>
        {!editing && project.description && <RichTextViewer content={project.description} />}
      </div>

      <div className="flex gap-sm border-b border-outline-variant mb-lg">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={`px-md py-sm text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
              <div className="flex items-center justify-between mb-md">
                <h2 className="text-lg font-semibold">项目信息</h2>
                <div className="flex items-center gap-sm">
                  {saved && <span className="text-xs text-success">已保存</span>}
                  {isOwner && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-sm text-secondary hover:text-secondary-container flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      编辑
                    </button>
                  )}
                  {editing && (
                    <div className="flex gap-sm">
                      <button onClick={() => { setEditing(false); setError(''); }} className="text-sm text-on-surface-variant hover:text-on-surface">取消</button>
                      <button onClick={handleSaveInfo} className="bg-secondary text-on-secondary px-4 py-1.5 rounded text-sm font-medium hover:opacity-90">保存</button>
                    </div>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="flex flex-col gap-md">
                  {error && <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg text-sm">{error}</div>}
                  <div className="grid grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">项目名称</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">状态</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary">
                        <option value="ACTIVE">进行中</option>
                        <option value="PAUSED">暂停</option>
                        <option value="COMPLETED">已完成</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase">描述</label>
                    <RichTextEditor content={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="请输入项目描述..." />
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">开始日期</label>
                      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">结束日期</label>
                      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-md text-sm">
                  <div>
                    <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">状态</div>
                    <span className={statusBadge(project.status)}>{statusLabel(project.status)}</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">负责人</div>
                    <div className="font-medium text-on-surface">{project.owner.name}</div>
                  </div>
                  {project.description && (
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">描述</div>
                      <RichTextViewer content={project.description} />
                    </div>
                  )}
                  {project.startDate && (
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">开始日期</div>
                      <div>{new Date(project.startDate).toLocaleDateString('zh-CN')}</div>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">结束日期</div>
                      <div>{new Date(project.endDate).toLocaleDateString('zh-CN')}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">成员数</div>
                    <div className="font-medium text-on-surface">{project.members.length} 人</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">创建时间</div>
                    <div>{new Date(project.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
              <div className="flex items-center justify-between mb-md">
                <h2 className="text-lg font-semibold">成员</h2>
                <Link to={`/projects/${id}/reports/write`} className="text-sm text-secondary hover:text-secondary-container">+ 写日报</Link>
              </div>

              {isOwner && (
                <div className="mb-md">
                  <div className="flex gap-sm mb-sm">
                    <select
                      value={addUserId}
                      onChange={(e) => setAddUserId(e.target.value)}
                      onFocus={loadAllUsers}
                      className="flex-1 border border-outline-variant rounded h-9 px-2 text-sm bg-white focus:outline-none focus:border-secondary"
                    >
                      <option value="">添加成员...</option>
                      {availableUsers.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <button onClick={handleAddMember} className="bg-secondary text-on-secondary px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 shrink-0">添加</button>
                  </div>
                  {memberError && <div className="text-xs text-danger mb-sm">{memberError}</div>}
                </div>
              )}

              <div className="flex flex-col gap-sm">
                {project.members.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-semibold">
                      {m.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.user.name}</div>
                    </div>
                    {isOwner && m.role !== 'OWNER' ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                        className="text-xs border border-outline-variant rounded px-1 py-0.5 bg-white"
                      >
                        <option value="MEMBER">成员</option>
                        <option value="OWNER">负责人</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {m.role === 'OWNER' ? '负责人' : '成员'}
                      </span>
                    )}
                    {isOwner && m.role !== 'OWNER' && (
                      <button onClick={() => handleRemoveMember(m.userId)} className="text-on-surface-variant hover:text-danger">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && <Outlet />}
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
