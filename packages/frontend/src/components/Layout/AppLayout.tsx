import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="text-lg font-bold text-slate-900">项目日报系统</div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-50">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button onClick={() => navigate('/profile')} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-50">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-lg overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
