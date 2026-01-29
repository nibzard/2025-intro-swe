'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { editReply } from '@/app/forum/reply/actions';
import { toast } from 'sonner';
import { X, Save, Eye, Edit3, Lightbulb } from 'lucide-react';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';

interface EditReplyFormProps {
  replyId: string;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditReplyForm({
  replyId,
  initialContent,
  onCancel,
  onSuccess,
}: EditReplyFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Sadržaj je obavezan');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Ažuriram odgovor...');

    try {
      const formData = new FormData();
      formData.append('replyId', replyId);
      formData.append('content', content.trim());

      const result = await editReply(formData);

      if (result.success) {
        toast.success('Odgovor uspješno ažuriran!', { id: loadingToast });
        onSuccess();
      } else {
        toast.error(result.error || 'Došlo je do greške', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Došlo je do greške pri ažuriranju', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSubmitting && content.trim()) {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        } else {
          toast.error('Sadržaj ne može biti prazan');
        }
      }
      // Escape to cancel
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, isSubmitting, onCancel]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tips Panel */}
      {showTips && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Savjeti za uređivanje
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Provjeri formatiranje u pregledu prije spremanja</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Ctrl+S za spremanje, Esc za odustajanje</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowTips(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Zatvori savjete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="edit-reply-content">Sadržaj</Label>
          <div className="flex items-center gap-2">
            {!showTips && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTips(true)}
                className="text-xs h-6"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Savjeti
              </Button>
            )}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                  !isPreviewMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                Uredi
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                  isPreviewMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Eye className="w-3 h-3" />
                Pregled
              </button>
            </div>
          </div>
        </div>

        {isPreviewMode ? (
          <div className="min-h-[150px] max-h-[400px] overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nema sadržaja za prikaz.
              </p>
            )}
          </div>
        ) : (
          <EnhancedMarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Unesite sadržaj odgovora..."
          />
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Odustani
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Spremam...' : 'Spremi promjene'}
        </Button>
      </div>
    </form>
  );
}
