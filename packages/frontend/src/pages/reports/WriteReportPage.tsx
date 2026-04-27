import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import api from '../../services/api';

export function WriteReportPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [hours, setHours] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [reportId, setReportId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const editor = useEditor({
    extensions: [StarterKit, TaskList, TaskItem, Placeholder.configure({ placeholder: '详细描述今天完成的工作...' })],
    content: '',
    onUpdate: ({ editor }) => triggerSave(editor.getHTML()),
  });

  useEffect(() => {
    if (projectId) api.get(`/projects/${projectId}`).then((r) => setProject(r.data.data)).catch(() => {});
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [projectId]);

  const triggerSave = (content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(content), 2000);
  };

  const saveDraft = async (content: string) => {
    if (!content || content === '<p></p>') return;
    setSaveStatus('saving');
    try {
      if (reportId) {
        await api.put(`/reports/${projectId}/${reportId}`, { content, hours: parseFloat(hours) || undefined, blockers, tomorrowPlan });
      } else {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await api.post(`/reports/${projectId}`, {
          date: today, content, todayDone: content.replace(/<[^>]+>/g, '').slice(0, 200),
          hours: parseFloat(hours) || undefined, blockers, tomorrowPlan,
        });
        setReportId(data.data.id);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async () => {
    if (!editor?.getText().trim()) return;
    const content = editor.getHTML();
    await saveDraft(content);

    if (reportId) {
      await api.put(`/reports/${projectId}/${reportId}/submit`);
    }
    navigate(`/projects/${projectId}/reports`);
  };

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">填写每日动态</h1>
          <p className="text-on-surface-variant mt-1">完成您的每日总结，以便项目团队了解最新进展。</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded border border-outline-variant/30">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_today</span>
          <span className="text-sm text-on-surface-variant">{today}</span>
        </div>
      </div>

      {/* Project info */}
      {project && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md mb-lg">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <div className="text-xs font-semibold text-on-surface-variant uppercase mb-1">项目</div>
              <div className="font-medium text-on-surface">{project.name}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface-variant uppercase mb-1">登记工时</div>
              <input
                type="number" value={hours} onChange={(e) => setHours(e.target.value)}
                min="0" max="24" step="0.5" placeholder="例如：8.0"
                className="w-full border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rich text editor */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden mb-lg">
        <div className="p-md border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface uppercase">今日工作完成情况 *</span>
          <div className="flex items-center gap-1">
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-sm">format_bold</span>
            </button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-sm">format_italic</span>
            </button>
            <div className="w-px h-4 bg-outline-variant/50 mx-1" />
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
            </button>
            <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-sm">format_list_numbered</span>
            </button>
            <div className="w-px h-4 bg-outline-variant/50 mx-1" />
            <button onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-sm">code</span>
            </button>
          </div>
        </div>
        <EditorContent editor={editor} className="prose prose-sm max-w-none p-md min-h-[200px] focus:outline-none" />
      </div>

      {/* Blockers + tomorrow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <label className="text-xs font-semibold text-on-surface uppercase flex items-center gap-2 mb-sm">
            遇到的困难与阻塞
            <span className="material-symbols-outlined text-sm text-danger">warning</span>
          </label>
          <textarea
            value={blockers} onChange={(e) => setBlockers(e.target.value)}
            rows={4} placeholder="有任何阻碍进度的问题吗？"
            className="w-full border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-y"
          />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <label className="text-xs font-semibold text-on-surface uppercase mb-sm block">明日计划</label>
          <textarea
            value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)}
            rows={4} placeholder="下一个工作日的主要目标是什么？"
            className="w-full border border-outline-variant rounded p-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-md border-t border-outline-variant/30">
        <div className="text-sm text-on-surface-variant">
          {saveStatus === 'saving' && '保存中...'}
          {saveStatus === 'saved' && '已保存草稿'}
          {saveStatus === 'error' && '保存失败'}
        </div>
        <div className="flex items-center gap-md">
          <button onClick={() => saveDraft(editor?.getHTML() || '')} className="text-sm bg-white border border-outline-variant px-5 py-2.5 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            保存草稿
          </button>
          <button onClick={handleSubmit} className="text-sm bg-primary text-on-primary px-6 py-2.5 rounded hover:bg-inverse-surface transition-colors flex items-center gap-2 shadow-sm">
            提交日报
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
