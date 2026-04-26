import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: 'grid_view', label: '仪表盘' },
  { to: '/projects', icon: 'inventory_2', label: '项目管理' },
  { to: '/reports/my', icon: 'description', label: '日报管理' },
  { to: '/reports/write', icon: 'edit_note', label: '填写日报' },
];

const adminItems = [
  { to: '/admin', icon: 'admin_panel_settings', label: '管理后台' },
  { to: '/admin/projects', icon: 'inventory_2', label: '项目管理' },
  { to: '/admin/reports', icon: 'description', label: '日报查看' },
  { to: '/admin/users', icon: 'group', label: '用户管理' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 border-r border-slate-200 bg-slate-50 flex flex-col gap-2 p-4 fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 mb-6 px-2 pt-2">
        <div className="w-8 h-8 rounded bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-sm">domain</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900">项目日报</span>
          <span className="text-slate-500 text-xs">管理系统</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-white text-slate-900 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-slate-200" />
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">管理</div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  )
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 pt-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-semibold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.role === 'ADMIN' ? '管理员' : '成员'}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
