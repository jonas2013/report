import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ content, onChange, placeholder = '请输入内容...', minHeight = '120px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external content changes into the editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant bg-surface-bright">
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
          <span className="material-symbols-outlined text-sm">format_bold</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
          <span className="material-symbols-outlined text-sm">format_italic</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-outline-variant/50 mx-1" />
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>
          <span className="text-xs font-bold">H2</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })}>
          <span className="text-xs font-bold">H3</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-outline-variant/50 mx-1" />
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
          <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
          <span className="material-symbols-outlined text-sm">format_list_numbered</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-outline-variant/50 mx-1" />
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')}>
          <span className="material-symbols-outlined text-sm">code</span>
        </ToolbarBtn>
      </div>

      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3" style={{ minHeight }} />
    </div>
  );
}

function ToolbarBtn({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:bg-surface-container-highest'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextViewer({ content }: { content: string }) {
  if (!content) return null;
  return <div className="prose prose-sm max-w-none text-on-surface" dangerouslySetInnerHTML={{ __html: content }} />;
}
