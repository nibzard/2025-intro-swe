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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="w-full max-w-4xl my-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pregled teme</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {category && (
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 text-sm font-semibold rounded-full"
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

              <h1 className="text-3xl font-bold">{title || 'Bez naslova'}</h1>

              {content ? (
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownRenderer content={content} />
                </div>
              ) : (
                <p className="text-gray-500 italic">Nema sadržaja...</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>Zatvori pregled</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
