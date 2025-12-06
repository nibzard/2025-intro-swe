'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Heading2,
  Eye,
  Edit3,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface EnhancedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onSave?: () => void;
}

export function EnhancedMarkdownEditor({
  value,
  onChange,
  placeholder = 'Započni pisati...',
  minHeight = '300px',
  maxLength = 10000,
  autoFocus = false,
  onSave,
}: EnhancedMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      // Ctrl/Cmd + P to toggle preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setActiveTab(activeTab === 'write' ? 'preview' : 'write');
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isFullscreen, onSave]);

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + before.length + textToInsert.length + after.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length);
      }
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**', 'bold text'), label: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'italic text'), label: 'Italic' },
    { icon: Heading2, action: () => insertMarkdown('## ', '', 'Heading'), label: 'Heading' },
    { icon: List, action: () => insertMarkdown('- ', '', 'list item'), label: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. ', '', 'list item'), label: 'Numbered List' },
    { icon: LinkIcon, action: () => insertMarkdown('[', '](url)', 'link text'), label: 'Link' },
    { icon: ImageIcon, action: () => insertMarkdown('![', '](url)', 'alt text'), label: 'Image' },
    { icon: Code, action: () => insertMarkdown('`', '`', 'code'), label: 'Inline Code' },
    { icon: Quote, action: () => insertMarkdown('> ', '', 'quote'), label: 'Quote' },
  ];

  const charCount = value.length;
  const charPercentage = maxLength ? (charCount / maxLength) * 100 : 0;
  const isNearLimit = charPercentage > 80;
  const isAtLimit = charCount >= (maxLength || 0);

  return (
    <div
      ref={containerRef}
      className={`
        ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : 'relative'}
        transition-all duration-200
      `}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Piši</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Pregled</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {maxLength && (
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                <span className={isNearLimit ? (isAtLimit ? 'text-red-500' : 'text-yellow-600') : ''}>
                  {charCount}
                </span>
                <span className="text-gray-400 dark:text-gray-600"> / {maxLength}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <TabsContent value="write" className="mt-0">
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
              {toolbarButtons.map((btn, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={btn.action}
                  className="h-8 w-8 p-0"
                  title={btn.label}
                  type="button"
                >
                  <btn.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>

            {/* Editor */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : minHeight }}
              maxLength={maxLength}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden sm:inline">Markdown je podržan</span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+P</kbd>
                <span className="hidden sm:inline">pregled</span>
              </div>
              {maxLength && (
                <div className="sm:hidden text-xs">
                  <span className={isNearLimit ? (isAtLimit ? 'text-red-500' : 'text-yellow-600') : ''}>
                    {charCount}/{maxLength}
                  </span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div
            className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-auto"
            style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : minHeight }}
          >
            {value ? (
              <div className="prose dark:prose-invert max-w-none">
                <MarkdownRenderer content={value} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nema sadržaja za pregled</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
