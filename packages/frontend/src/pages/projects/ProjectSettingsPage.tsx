import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/Common/RichTextEditor';

export function ProjectSettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<any>(null);
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

  const loadAllUsers = async () => {
    if (allUsers.length > 0) return;
    const { data } = await api.get('/users?limit=100');
    setAllUsers(data.data.data);
  };

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
      loadProject();
    } catch (e: any) {
      setError(e.response?.data?.error || '保存失败');
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

  const handleArchive = async () => {
    if (!confirm('确认归档该项目？')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (!project) return null;

  const memberIds = new Set(project.members.map((m: any) => m.userId));
  const availableUsers = allUsers.filter((u: any) => !memberIds.has(u.id) && u.isActive);

  return (
    <div className="max-w-[800px]">
      {/* Project info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-lg font-semibold">基本信息</h2>
          {saved && <span className="text-xs text-success">已保存</span>}
        </div>
        {error && <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">{error}</div>}
        <div className="flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase">项目名称 *</label>
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
          <div className="flex justify-end">
            <button onClick={handleSaveInfo} className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">保存</button>
          </div>
        </div>
      </div>

      {/* Member management */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
        <h2 className="text-lg font-semibold mb-md">成员管理</h2>
        <div className="flex gap-sm mb-md">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            onFocus={loadAllUsers}
            className="flex-1 border border-outline-variant rounded h-10 px-3 text-sm bg-white focus:outline-none focus:border-secondary"
          >
            <option value="">选择用户添加到项目...</option>
            {availableUsers.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <button onClick={handleAddMember} className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-medium hover:opacity-90 shrink-0">添加成员</button>
        </div>
        {memberError && <div className="text-sm text-danger mb-sm">{memberError}</div>}
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
            {project.members.map((m: any) => (
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
        <button onClick={handleArchive} className="bg-danger text-white px-4 py-1.5 rounded text-xs font-medium hover:opacity-90">归档项目</button>
      </div>
    </div>
  );
}
