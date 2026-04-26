import { useEffect, useState } from 'react';
import api from '../../services/api';

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stats/overview').then((r) => setOverview(r.data.data));
    api.get('/projects?limit=5').then((r) => {
      // Get recent reports from first project
      if (r.data.data.data.length > 0) {
        api.get(`/projects/${r.data.data.data[0].id}/reports?limit=5`).then((rr) => setReports(rr.data.data.data));
      }
    });
  }, []);

  if (!overview) return <div className="p-xl text-center text-on-surface-variant">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">系统概览</h1>
          <p className="text-on-surface-variant mt-1">所有活跃项目的实时指标和运行健康状况。</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {[
          { label: '活跃项目', value: overview.projectCount, icon: 'inventory_2', color: 'text-secondary' },
          { label: '总用户数', value: overview.userCount, icon: 'group', color: 'text-on-surface-variant' },
          { label: '今日已提交', value: overview.todayReports, icon: 'description', color: 'text-on-surface-variant' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-on-surface-variant uppercase">{kpi.label}</span>
              <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
            </div>
            <div className="text-3xl font-bold text-on-surface">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* 7-day trend */}
      {overview.trend?.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
          <h2 className="text-lg font-semibold mb-md">近7天提交趋势</h2>
          <div className="flex items-end gap-sm h-32">
            {overview.trend.map((t: any) => {
              const max = Math.max(...overview.trend.map((x: any) => x._count.id), 1);
              const height = Math.max((t._count.id / max) * 100, 4);
              return (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium">{t._count.id}</span>
                  <div className="w-full bg-secondary rounded-t" style={{ height: `${height}%` }} />
                  <span className="text-[10px] text-on-surface-variant">{new Date(t.date).toLocaleDateString('zh-CN', { day: 'numeric' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
