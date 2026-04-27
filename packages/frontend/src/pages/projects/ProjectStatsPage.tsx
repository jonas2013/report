import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

export function ProjectStatsPage() {
  const { id } = useParams();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/reports/${id}/stats`).then((r) => setStats(r.data.data));
    api.get(`/stats/projects/${id}/activity`).then((r) => setActivity(r.data.data));
  }, [id]);

  const chartData = activity.map((a) => ({
    date: new Date(a.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    count: a._count.id,
  }));

  return (
    <div>
      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <div className="text-xs font-semibold text-on-surface-variant uppercase mb-1">已提交日报</div>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <div className="text-xs font-semibold text-on-surface-variant uppercase mb-1">总工时</div>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
          </div>
        </div>
      )}

      {/* Activity chart */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
        <h2 className="text-lg font-semibold mb-md">近30天提交趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#0058be" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member stats */}
      {stats?.memberStats && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
          <h2 className="text-lg font-semibold mb-md">成员统计</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase">成员</th>
                <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase text-right">已提交</th>
                <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase text-right">工时</th>
                <th className="p-sm text-xs font-semibold text-on-surface-variant uppercase text-right">提交率</th>
              </tr>
            </thead>
            <tbody>
              {stats.memberStats.map((ms: any) => (
                <tr key={ms.user.id} className="border-b border-outline-variant last:border-0">
                  <td className="p-sm text-sm font-medium">{ms.user.name}</td>
                  <td className="p-sm text-sm text-right">{ms.submittedDays} 天</td>
                  <td className="p-sm text-sm text-right">{ms.totalHours}h</td>
                  <td className="p-sm text-sm text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ms.submitRate >= 80 ? 'bg-green-100 text-green-800' : ms.submitRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {ms.submitRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
