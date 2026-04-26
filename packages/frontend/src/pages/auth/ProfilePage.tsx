import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export function ProfilePage() {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pwMode, setPwMode] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', { name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await api.put('/auth/me/password', { oldPassword: oldPw, newPassword: newPw });
      setPwMsg('密码已修改');
      setOldPw('');
      setNewPw('');
    } catch (e: any) {
      setPwMsg(e.response?.data?.error || '修改失败');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-[600px] mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-lg">个人设置</h1>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
        <h2 className="text-lg font-semibold mb-md">基本信息</h2>
        <div className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase">姓名</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase">邮箱</label>
            <input value={user.email} disabled className="border border-outline-variant rounded h-10 px-3 text-sm bg-surface-container-low text-on-surface-variant" />
          </div>
          <div className="flex items-center gap-md">
            <button onClick={handleSave} disabled={saving} className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
            {saved && <span className="text-sm text-success">已保存</span>}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-lg font-semibold">修改密码</h2>
          {!pwMode && (
            <button onClick={() => setPwMode(true)} className="text-sm text-secondary hover:text-secondary-container">
              修改密码
            </button>
          )}
        </div>
        {pwMode && (
          <form onSubmit={handleChangePw} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface uppercase">当前密码</label>
              <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-xs font-semibold text-on-surface uppercase">新密码</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
            </div>
            <div className="flex items-center gap-md">
              <button type="submit" className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">确认修改</button>
              <button type="button" onClick={() => { setPwMode(false); setPwMsg(''); }} className="text-sm text-on-surface-variant hover:text-on-surface">取消</button>
              {pwMsg && <span className={`text-sm ${pwMsg.includes('已') ? 'text-success' : 'text-danger'}`}>{pwMsg}</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
