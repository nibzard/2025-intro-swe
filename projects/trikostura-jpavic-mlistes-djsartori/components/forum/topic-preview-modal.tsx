'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TopicPreviewModalProps {
  title: string;
  content: string;
  category: { name: string; icon: string; color: string } | null;
  tags: Array<{ name: string; color: string }>;
  onClose: () => void;
}

export function TopicPreviewModal({ title, content, category, tags, onClose }: TopicPreviewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 dark:bg-black/70 overflow-y-auto p-3 sm:p-4">
      <div className="w-full max-w-4xl my-4 sm:my-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Pregled teme</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {category && (
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full"
                    style={{
                      backgroundColor: category.color + '20',
                      color: category.color,
                    }}
                  >
                    {category.icon} {category.name}
                  </span>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium rounded-md"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title || 'Bez naslova'}</h1>

              {content ? (
                <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                  <MarkdownRenderer content={content} />
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Nema sadržaja...</p>
              )}
            </div>

            <div className="mt-4 sm:mt-6 flex justify-end">
              <Button onClick={onClose} className="w-full sm:w-auto">Zatvori pregled</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
