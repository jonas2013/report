import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { RichTextEditor } from '../../components/Common/RichTextEditor';

export function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.post('/projects', { name, description: description || undefined, startDate: startDate || undefined, endDate: endDate || undefined });
    navigate(`/projects/${data.data.id}`);
  };

  return (
    <div className="max-w-[600px] mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-lg">创建项目</h1>
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <label className="text-xs font-semibold text-on-surface uppercase">项目名称 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-xs font-semibold text-on-surface-variant uppercase">项目描述</label>
          <RichTextEditor content={description} onChange={setDescription} placeholder="请输入项目描述..." />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase">开始日期</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase">结束日期</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
          </div>
        </div>
        <div className="flex justify-end gap-md pt-md">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface text-sm">取消</button>
          <button type="submit" className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-medium hover:opacity-90">创建项目</button>
        </div>
      </form>
    </div>
  );
}
