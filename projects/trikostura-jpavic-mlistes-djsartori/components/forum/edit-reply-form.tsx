'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { editReply } from '@/app/forum/reply/actions';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-reply-content">Sadržaj</Label>
        <EnhancedMarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Unesite sadržaj odgovora..."
        />
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
