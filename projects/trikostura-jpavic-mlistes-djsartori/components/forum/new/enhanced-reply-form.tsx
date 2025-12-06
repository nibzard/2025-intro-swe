'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedMarkdownEditor } from './enhanced-markdown-editor';
import { EnhancedFileUpload } from './enhanced-file-upload';
import { Send, X, Quote as QuoteIcon, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments';
import { toast } from 'sonner';

interface EnhancedReplyFormProps {
  topicId: string;
  topicSlug: string;
  quotedText?: string;
  quotedAuthor?: string;
  onClearQuote?: () => void;
  compact?: boolean;
}

const MAX_REPLY_LENGTH = 5000;

export function EnhancedReplyForm({
  topicId,
  topicSlug,
  quotedText,
  quotedAuthor,
  onClearQuote,
  compact = false,
}: EnhancedReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(
    quotedText && quotedAuthor ? `> ${quotedAuthor} je napisao:\n> ${quotedText}\n\n` : ''
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError('');

      if (!content.trim()) {
        setError('Odgovor ne može biti prazan');
        toast.error('Odgovor ne može biti prazan');
        return;
      }

      setIsSubmitting(true);
      const loadingToast = toast.loading('Objavljujem odgovor...');

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Morate biti prijavljeni');
        }

        // Create reply
        const { data: reply, error: replyError } = await (supabase as any)
          .from('replies')
          .insert({
            content: content.trim(),
            topic_id: topicId,
            author_id: user.id,
          })
          .select()
          .single();

        if (replyError) throw replyError;

        // Upload attachments
        if (selectedFiles.length > 0 && reply) {
          for (const file of selectedFiles) {
            try {
              const result = await uploadAttachment(file, user.id);
              if (result.url) {
                await saveAttachmentMetadata(
                  result.url,
                  file.name,
                  file.size,
                  file.type,
                  user.id,
                  reply.id,
                  'reply'
                );
              }
            } catch (err) {
              console.error('Error uploading file:', err);
            }
          }
        }

        toast.success('Odgovor uspješno objavljen!', { id: loadingToast });

        // Reset form
        setContent('');
        setSelectedFiles([]);
        onClearQuote?.();

        // Refresh page
        router.refresh();
      } catch (err: any) {
        console.error('Error creating reply:', err);
        setError(err.message || 'Došlo je do greške');
        toast.error(err.message || 'Došlo je do greške pri objavi odgovora', { id: loadingToast });
        setIsSubmitting(false);
      }
    },
    [content, topicId, selectedFiles, router, onClearQuote]
  );

  // Keyboard shortcut for submit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote indicator */}
          {quotedText && quotedAuthor && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
              <QuoteIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                  Citirate {quotedAuthor}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {quotedText}
                </p>
              </div>
              {onClearQuote && (
                <button
                  type="button"
                  onClick={onClearQuote}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Editor */}
          <div>
            <EnhancedMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Napiši svoj odgovor..."
              minHeight={compact ? '200px' : '250px'}
              maxLength={MAX_REPLY_LENGTH}
              onSave={handleSubmit}
            />
          </div>

          {/* File Upload */}
          <EnhancedFileUpload
            files={selectedFiles}
            onChange={setSelectedFiles}
            maxFiles={3}
            compact={compact}
          />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="hidden sm:inline">Pritisni</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono">
                Enter
              </kbd>
              <span className="hidden sm:inline">za brzu objavu</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Objavljujem...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Objavi odgovor
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
