'use client';

import { useState, forwardRef } from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { Button } from '@/components/ui/button';
import { Eye, Edit, HelpCircle } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  name?: string;
  required?: boolean;
}

export const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  function MarkdownEditor({
    value,
    onChange,
    placeholder = 'Piši ovdje...',
    rows = 6,
    name,
    required = false,
  }, ref) {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'write'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Piši
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Pregled
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
          title="Markdown pomoć"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Help Guide */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Markdown formatiranje:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">**bold**</code> -{' '}
              <strong>podebljano</strong>
            </div>
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">*italic*</code> -{' '}
              <em>kurziv</em>
            </div>
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded"># Heading</code> -
              Naslov
            </div>
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">- lista</code> - Lista
            </div>
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">[link](url)</code> -
              Link
            </div>
            <div>
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">`code`</code> - Kod
            </div>
            <div className="col-span-2">
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">```js code ```</code> -
              Kod blok sa sintaksom
            </div>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      {activeTab === 'write' ? (
        <textarea
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-y font-mono text-sm"
        />
      ) : (
        <div className="min-h-[150px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Nema sadržaja za prikaz...
            </p>
          )}
        </div>
      )}
    </div>
  );
});
