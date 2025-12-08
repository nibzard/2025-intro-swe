'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/forum/markdown-editor';
import { AdvancedFileUpload } from '@/components/forum/advanced-file-upload';
import { createClient } from '@/lib/supabase/client';
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments';
import { processMentions } from '@/app/forum/actions';
import { toast } from 'sonner';
import { Send, Loader2, Smile } from 'lucide-react';

interface ReplyFormProps {
  topicId: string;
  quotedText?: string;
  quotedAuthor?: string;
  onSuccess?: () => void;
}

const MAX_CONTENT_LENGTH = 10000;

// Common emojis for quick access
const QUICK_EMOJIS = ['👍', '👎', '😊', '😂', '❤️', '🎉', '🤔', '👏', '🔥', '💯'];

export function ReplyForm({ topicId, quotedText, quotedAuthor, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState(quotedText ? `> ${quotedText.split('\n').join('\n> ')}\n\n@${quotedAuthor} ` : '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialContentRef = useRef(content);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content.trim() !== initialContentRef.current.trim() || selectedFiles.length > 0);
  }, [content, selectedFiles]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && content.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const validateContent = useCallback(() => {
    if (!content.trim()) {
      toast.error('Sadržaj odgovora ne može biti prazan');
      return false;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      toast.error(`Sadržaj ne smije biti duži od ${MAX_CONTENT_LENGTH} znakova`);
      return false;
    }

    return true;
  }, [content]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);

    setContent(newContent);

    // Restore cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateContent()) {
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const toastId = toast.loading('Objavljujem odgovor...');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Morate biti prijavljeni', { id: toastId });
        setIsSubmitting(false);
        return;
      }

      const { error: insertError, data: newReply } = await (supabase as any)
        .from('replies')
        .insert({
          content: content.trim(),
          topic_id: topicId,
          author_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Upload attachments with progress
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const progress = ((i + 1) / selectedFiles.length) * 100;
          setUploadProgress(progress);

          toast.loading(`Učitavam datoteke... (${i + 1}/${selectedFiles.length})`, { id: toastId });

          const { url, error: uploadError } = await uploadAttachment(file, user.id);

          if (uploadError || !url) {
            console.error('Failed to upload file:', file.name, uploadError);
            toast.warning(`Nije uspjelo učitavanje: ${file.name}`);
            continue;
          }

          await saveAttachmentMetadata(
            url,
            file.name,
            file.size,
            file.type,
            user.id,
            newReply.id,
            'reply'
          );
        }
      }

      // Process mentions and create notifications
      await processMentions(content.trim(), user.id, topicId, newReply.id);

      toast.success('Odgovor uspješno objavljen!', { id: toastId });

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setHasUnsavedChanges(false);
      setIsSubmitting(false);
      setUploadProgress(0);
      initialContentRef.current = '';

      // Callback or refresh
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }

    } catch (error: any) {
      console.error('Reply submission error:', error);
      toast.error(error?.message || 'Greška pri objavljivanju odgovora', { id: toastId });

      // Save content to localStorage for recovery
      if (content.trim()) {
        localStorage.setItem(`reply-draft-${topicId}`, content);
        toast.info('Sadržaj spremljen u međuspremnik');
      }

      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  const charactersLeft = useMemo(() => MAX_CONTENT_LENGTH - content.length, [content]);
  const isOverLimit = useMemo(() => charactersLeft < 0, [charactersLeft]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <MarkdownEditor
            ref={textareaRef}
            value={content}
            onChange={setContent}
            placeholder="Napiši svoj odgovor... (Markdown podržan) • Ctrl+Enter za objavu"
            rows={6}
          />

          {/* Emoji Picker Button */}
          <div className="absolute bottom-2 right-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-8 w-8 p-0"
              title="Dodaj emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Emoji Picker */}
        {showEmojiPicker && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  insertEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-2xl hover:scale-125 transition-transform"
                title={`Dodaj ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Character Counter */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span>Markdown podržan</span>
            {hasUnsavedChanges && (
              <span className="text-orange-600 dark:text-orange-400">
                • Nespremljene promjene
              </span>
            )}
          </div>
          <span className={`font-medium ${isOverLimit ? 'text-red-600 dark:text-red-400' : charactersLeft < 100 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {isOverLimit ? `${Math.abs(charactersLeft)} preko limita` : `${charactersLeft.toLocaleString()} preostalo`}
          </span>
        </div>
      </div>

      <AdvancedFileUpload onFilesChange={setSelectedFiles} maxFiles={3} />

      {/* Upload Progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Učitavanje datoteka...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || isOverLimit}
          className="min-w-[160px]"
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

      {/* Keyboard Shortcut Hint */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Savjet: Pritisni <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd> za brzu objavu
      </p>
    </form>
  );
}
