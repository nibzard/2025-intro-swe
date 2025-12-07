'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { editTopic } from '@/app/forum/topic/actions';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';

interface EditTopicFormProps {
  topicId: string;
  initialTitle: string;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditTopicForm({
  topicId,
  initialTitle,
  initialContent,
  onCancel,
  onSuccess
}: EditTopicFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Naslov je obavezan');
      return;
    }

    if (!content.trim()) {
      toast.error('Sadržaj je obavezan');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Ažuriram temu...');

    try {
      const formData = new FormData();
      formData.append('topicId', topicId);
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      const result = await editTopic(formData);

      if (result.success) {
        toast.success('Tema uspješno ažurirana!', { id: loadingToast });
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
        <Label htmlFor="edit-title">Naslov</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Unesite naslov teme..."
          maxLength={200}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/200 znakova
        </p>
      </div>

      <div>
        <Label htmlFor="edit-content">Sadržaj</Label>
        <EnhancedMarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Unesite sadržaj teme..."
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
