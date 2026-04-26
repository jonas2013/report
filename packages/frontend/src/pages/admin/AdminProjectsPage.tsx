import { useEffect, useState } from 'react';
import api from '../../services/api';
import { RichTextEditor, RichTextViewer } from '../../components/Common/RichTextEditor';

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addUserId, setAddUserId] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'ACTIVE', startDate: '', endDate: '' });
  const [saved, setSaved] = useState(false);

  // Create project state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [createError, setCreateError] = useState('');

  const loadProjects = async () => {
    const { data } = await api.get('/projects?limit=100');
    setProjects(data.data.data);
  };

  const loadUsers = async () => {
    const { data } = await api.get('/users?limit=100');
    setAllUsers(data.data.data);
  };

  useEffect(() => { loadProjects(); loadUsers(); }, []);

  const selectProject = async (p: any) => {
    const { data } = await api.get(`/projects/${p.id}`);
    const full = data.data;
    setSelected(full);
    setError('');
    setEditing(false);
    setShowCreate(false);
    setForm({
      name: full.name,
      description: full.description || '',
      status: full.status,
      startDate: full.startDate ? full.startDate.split('T')[0] : '',
      endDate: full.endDate ? full.endDate.split('T')[0] : '',
    });
    const mRes = await api.get(`/projects/${full.id}/members`);
    setMembers(mRes.data.data);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreateError('');
    try {
      const { data } = await api.post('/projects', {
        name: createForm.name,
        description: createForm.description || undefined,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
      });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', startDate: '', endDate: '' });
      loadProjects();
      selectProject(data.data);
    } catch (e: any) {
      setCreateError(e.response?.data?.error || '创建失败');
    }
  };

  const handleSaveInfo = async () => {
    if (!selected) return;
    setError('');
    try {
      await api.put(`/projects/${selected.id}`, {
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      if (form.status !== selected.status) {
        await api.put(`/projects/${selected.id}/status`, { status: form.status });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
      loadProjects();
      selectProject({ ...selected, status: form.status });
    } catch (e: any) {
      setError(e.response?.data?.error || '保存失败');
    }
  };

  const handleAddMember = async () => {
    if (!addUserId || !selected) return;
    setError('');
    try {
      await api.post(`/projects/${selected.id}/members`, { userId: addUserId });
      setAddUserId('');
      const { data } = await api.get(`/projects/${selected.id}/members`);
      setMembers(data.data);
    } catch (e: any) {
      setError(e.response?.data?.error || '添加失败');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selected) return;
    await api.delete(`/projects/${selected.id}/members/${userId}`);
    const { data } = await api.get(`/projects/${selected.id}/members`);
    setMembers(data.data);
  };

  const handleChangeRole = async (userId: string, role: string) => {
    if (!selected) return;
    await api.put(`/projects/${selected.id}/members/${userId}/role`, { role });
    const { data } = await api.get(`/projects/${selected.id}/members`);
    setMembers(data.data);
  };

  const handleArchive = async (id: string) => {
    await api.delete(`/projects/${id}`);
    setSelected(null);
    loadProjects();
  };

  const memberIds = new Set(members.map((m: any) => m.userId));
  const availableUsers = allUsers.filter((u: any) => !memberIds.has(u.id) && u.isActive);

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-2xl font-bold text-on-surface">项目管理</h1>
        <button
          onClick={() => { setShowCreate(true); setSelected(null); setEditing(false); }}
          className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          新建项目
        </button>
      </div>

      {/* Create project form */}
      {showCreate && (
        <div className="bg-surface-container-lowest border border-secondary/30 rounded-xl p-lg mb-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-lg font-semibold">新建项目</h2>
            <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {createError && <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">{createError}</div>}
          <div className="flex flex-col gap-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">项目名称 *</label>
                <input
                  value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="输入项目名称" required
                  className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">开始日期</label>
                <input
                  type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase">项目描述</label>
              <RichTextEditor content={createForm.description} onChange={(v) => setCreateForm({ ...createForm, description: v })} placeholder="请输入项目描述..." />
            </div>
            <div className="flex justify-end gap-md">
              <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="text-sm text-on-surface-variant hover:text-on-surface">取消</button>
              <button onClick={handleCreate} className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">创建</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-lg">
        {/* Left: project list */}
        <div className="w-80 shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p)}
                className={`w-full text-left p-md border-b border-outline-variant last:border-0 transition-colors ${
                  selected?.id === p.id ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className={statusBadge(p.status)}>{statusLabel(p.status)}</span>
                </div>
                <div className="text-xs text-on-surface-variant mt-1">
                  负责人：{p.owner.name} · {p._count.members} 人
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: project detail */}
        <div className="flex-1 min-w-0">
          {!selected && !showCreate ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-sm">inventory_2</span>
              <div>选择左侧项目查看详情，或点击「新建项目」创建</div>
            </div>
          ) : selected ? (
            <>
              {/* Project info card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
                <div className="flex items-center justify-between mb-md">
                  <h2 className="text-lg font-semibold text-on-surface">项目信息</h2>
                  <div className="flex items-center gap-sm">
                    {saved && <span className="text-xs text-success">已保存</span>}
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-sm text-secondary hover:text-secondary-container flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        编辑
                      </button>
                    ) : (
                      <div className="flex gap-sm">
                        <button onClick={() => setEditing(false)} className="text-sm text-on-surface-variant hover:text-on-surface">取消</button>
                        <button onClick={handleSaveInfo} className="bg-secondary text-on-secondary px-4 py-1.5 rounded text-sm font-medium hover:opacity-90">保存</button>
                      </div>
                    )}
                  </div>
                </div>

                {editing ? (
                  <div className="flex flex-col gap-md">
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">项目名称 *</label>
                        <input
                          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">状态</label>
                        <select
                          value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary"
                        >
                          <option value="ACTIVE">进行中</option>
                          <option value="PAUSED">暂停</option>
                          <option value="COMPLETED">已完成</option>
                          <option value="ARCHIVED">已归档</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">项目描述</label>
                      <RichTextEditor content={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="请输入项目描述..." />
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">开始日期</label>
                        <input
                          type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">结束日期</label>
                        <input
                          type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-md text-sm">
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">项目名称</div>
                      <div className="font-medium text-on-surface">{selected.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">状态</div>
                      <span className={statusBadge(selected.status)}>{statusLabel(selected.status)}</span>
                    </div>
                    {selected.description && (
                      <div className="col-span-2">
                        <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">描述</div>
                        <RichTextViewer content={selected.description} />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">负责人</div>
                      <div className="font-medium text-on-surface">{selected.owner.name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">成员</div>
                      <div className="font-medium text-on-surface">{members.length} 人</div>
                    </div>
                    {selected.startDate && (
                      <div>
                        <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">开始日期</div>
                        <div>{new Date(selected.startDate).toLocaleDateString('zh-CN')}</div>
                      </div>
                    )}
                    {selected.endDate && (
                      <div>
                        <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">结束日期</div>
                        <div>{new Date(selected.endDate).toLocaleDateString('zh-CN')}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-on-surface-variant uppercase mb-xs">创建时间</div>
                      <div>{new Date(selected.createdAt).toLocaleDateString('zh-CN')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Member management */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
                <h3 className="text-lg font-semibold mb-md">成员管理</h3>
                <div className="flex gap-sm mb-md">
                  <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="flex-1 border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary">
                    <option value="">选择用户添加到项目...</option>
                    {availableUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <button onClick={handleAddMember} className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-medium hover:opacity-90 shrink-0">添加成员</button>
                </div>
                {error && <div className="text-sm text-danger mb-sm">{error}</div>}
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase">成员</th>
                      <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase">邮箱</th>
                      <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase">角色</th>
                      <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.userId} className="border-b border-outline-variant last:border-0">
                        <td className="p-sm">
                          <div className="flex items-center gap-sm">
                            <div className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-[10px] font-semibold">
                              {m.user.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{m.user.name}</span>
                          </div>
                        </td>
                        <td className="p-sm text-sm text-on-surface-variant">{m.user.email}</td>
                        <td className="p-sm">
                          <select value={m.role} onChange={(e) => handleChangeRole(m.userId, e.target.value)} className="text-xs border border-outline-variant rounded px-2 py-1 bg-white">
                            <option value="OWNER">负责人</option>
                            <option value="MEMBER">成员</option>
                          </select>
                        </td>
                        <td className="p-sm text-right">
                          {m.role !== 'OWNER' && (
                            <button onClick={() => handleRemoveMember(m.userId)} className="text-xs text-danger hover:underline">移除</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Danger zone */}
              <div className="bg-surface-container-lowest border border-danger/30 rounded-xl p-lg">
                <h3 className="text-sm font-semibold text-danger mb-sm">危险操作</h3>
                <p className="text-xs text-on-surface-variant mb-sm">归档后项目将不再活跃，所有数据保留。</p>
                <button onClick={() => handleArchive(selected.id)} className="bg-danger text-white px-4 py-1.5 rounded text-xs font-medium hover:opacity-90">归档项目</button>
              </div>
            </>
          ) : null}
        </div>
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
