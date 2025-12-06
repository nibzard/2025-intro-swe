'use client';

import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link2, Code, Quote, Heading1, Heading2, Image as ImageIcon } from 'lucide-react';

interface FormattingToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

export function FormattingToolbar({ onInsert }: FormattingToolbarProps) {
  const buttons = [
    { icon: Bold, label: 'Bold', before: '**', after: '**' },
    { icon: Italic, label: 'Italic', before: '_', after: '_' },
    { icon: Heading1, label: 'Heading 1', before: '# ', after: '' },
    { icon: Heading2, label: 'Heading 2', before: '## ', after: '' },
    { icon: List, label: 'Bullet List', before: '- ', after: '' },
    { icon: ListOrdered, label: 'Numbered List', before: '1. ', after: '' },
    { icon: Link2, label: 'Link', before: '[', after: '](url)' },
    { icon: ImageIcon, label: 'Image', before: '![alt text](', after: ')' },
    { icon: Code, label: 'Code', before: '`', after: '`' },
    { icon: Quote, label: 'Quote', before: '> ', after: '' },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
      {buttons.map((btn) => (
        <Button
          key={btn.label}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onInsert(btn.before, btn.after)}
          title={btn.label}
          className="h-8 w-8 p-0"
        >
          <btn.icon className="w-4 h-4" />
        </Button>
      ))}
      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center px-2">
        Markdown podržan
      </div>
    </div>
  );
}
