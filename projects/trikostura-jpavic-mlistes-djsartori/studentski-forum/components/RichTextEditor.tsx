'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Počni pisati...',
  className = ''
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-3 py-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-700/50 px-4 py-3 min-h-[150px]">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-3 py-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h6M12 4l-4 16M8 20h6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Strikethrough"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M8 5h8M9 19h6" />
          </svg>
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Bullet List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Numbered List"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h12M9 12h12M9 19h12M3 5v4m0 0v4m0-4h.01M3 16v4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Quote"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-600 text-purple-600 dark:text-purple-400' : ''
          }`}
          title="Code Block"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Horizontal Line"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-700/50">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
