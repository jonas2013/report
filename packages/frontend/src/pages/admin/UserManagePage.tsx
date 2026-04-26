import { useEffect, useState } from 'react';
import api from '../../services/api';

export function UserManagePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'MEMBER' });
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'MEMBER' });
  const [editError, setEditError] = useState('');
  const [editSaved, setEditSaved] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const load = () => {
    api.get(`/users?search=${search}&limit=100`).then((r) => setUsers(r.data.data.data));
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', newUser);
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'MEMBER' });
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || '创建失败');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await api.put(`/users/${id}`, { isActive: !isActive });
    load();
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setEditError('');
    setEditSaved(false);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditError('');
    setEditSaved(false);
    try {
      await api.put(`/users/${editUser.id}`, editForm);
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 2000);
      load();
    } catch (e: any) {
      setEditError(e.response?.data?.error || '保存失败');
    }
  };

  const handleResetPw = async () => {
    if (!resetPwUser || !newPw) return;
    setResetMsg('');
    try {
      await api.put(`/users/${resetPwUser}/reset-password`, { password: newPw });
      setResetMsg('密码已重置');
      setNewPw('');
      setTimeout(() => { setResetPwUser(null); setResetMsg(''); }, 1500);
    } catch (e: any) {
      setResetMsg(e.response?.data?.error || '重置失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h1 className="text-2xl font-bold text-on-surface">用户管理</h1>
        <button onClick={() => setShowCreate(true)} className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:opacity-90">
          <span className="material-symbols-outlined text-sm">person_add</span>
          新建用户
        </button>
      </div>

      <div className="mb-md">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名或邮箱..." className="w-full max-w-md border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
        />
      </div>

      {/* Create user form */}
      {showCreate && (
        <div className="bg-surface-container-lowest border border-secondary/30 rounded-xl p-lg mb-lg">
          <h2 className="text-lg font-semibold mb-md">新建用户</h2>
          {error && <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-md">
            <div className="grid grid-cols-2 gap-md">
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="姓名 *" required className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="邮箱 *" type="email" required className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="密码 *" type="password" required minLength={6} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm bg-white">
                <option value="MEMBER">普通成员</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>
            <div className="flex justify-end gap-md">
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-on-surface-variant">取消</button>
              <button type="submit" className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">创建</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit user drawer */}
      {editUser && (
        <div className="bg-surface-container-lowest border border-secondary/30 rounded-xl p-lg mb-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-lg font-semibold">编辑用户</h2>
            <button onClick={() => setEditUser(null)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {editError && <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">{editError}</div>}
          <div className="flex flex-col gap-md">
            <div className="grid grid-cols-3 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">姓名</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">邮箱</label>
                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} type="email" className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">角色</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="border border-outline-variant rounded h-10 px-3 text-sm bg-white">
                  <option value="MEMBER">普通成员</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <button onClick={handleEditSave} className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">保存</button>
              {editSaved && <span className="text-sm text-success">已保存</span>}
            </div>
          </div>
        </div>
      )}

      {/* Reset password dialog */}
      {resetPwUser && (
        <div className="bg-surface-container-lowest border border-warning/30 rounded-xl p-lg mb-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-lg font-semibold">重置密码</h2>
            <button onClick={() => { setResetPwUser(null); setResetMsg(''); setNewPw(''); }} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="flex items-end gap-md">
            <div className="flex flex-col gap-xs flex-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase">新密码</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={6} placeholder="至少6位" className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
            </div>
            <button onClick={handleResetPw} className="bg-warning text-white px-6 py-2 rounded text-sm font-medium hover:opacity-90 shrink-0">确认重置</button>
          </div>
          {resetMsg && <div className={`text-sm mt-sm ${resetMsg.includes('已') ? 'text-success' : 'text-danger'}`}>{resetMsg}</div>}
        </div>
      )}

      {/* User table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface">
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase">用户</th>
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase">邮箱</th>
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase">角色</th>
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase">项目数</th>
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase">状态</th>
              <th className="p-md text-xs font-semibold text-on-surface-variant uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-outline-variant last:border-0 hover:bg-surface-container-low ${!u.isActive ? 'opacity-60' : ''}`}>
                <td className="p-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-semibold">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="p-md text-sm text-on-surface-variant">{u.email}</td>
                <td className="p-md">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role === 'ADMIN' ? '管理员' : '成员'}
                  </span>
                </td>
                <td className="p-md text-sm">{u._count?.projectMembers || 0}</td>
                <td className="p-md">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? '启用' : '停用'}
                  </span>
                </td>
                <td className="p-md text-right">
                  <div className="flex items-center justify-end gap-sm">
                    <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-outline-variant rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      编辑
                    </button>
                    <button onClick={() => { setResetPwUser(u.id); setResetMsg(''); setNewPw(''); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-warning/40 rounded bg-warning/5 text-warning hover:bg-warning/10 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">key</span>
                      重置密码
                    </button>
                    <button onClick={() => handleToggleActive(u.id, u.isActive)} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
                      u.isActive
                        ? 'border-danger/40 bg-danger/5 text-danger hover:bg-danger/10'
                        : 'border-success/40 bg-success/5 text-success hover:bg-success/10'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">{u.isActive ? 'block' : 'check_circle'}</span>
                      {u.isActive ? '停用' : '启用'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
