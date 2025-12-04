'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/forum/markdown-editor';
import { createClient } from '@/lib/supabase/client';

export function ReplyForm({ topicId }: { topicId: string }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError('Sadržaj odgovora ne može biti prazan');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Morate biti prijavljeni');
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await (supabase as any).from('replies').insert({
      content: content.trim(),
      topic_id: topicId,
      author_id: user.id,
    });

    if (insertError) {
      setError('Greška pri dodavanju odgovora');
      setIsSubmitting(false);
      return;
    }

    setContent('');
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          {error}
        </div>
      )}

      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Napiši svoj odgovor... (Markdown podržan)"
        rows={6}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Slanje...' : 'Objavi odgovor'}
        </Button>
      </div>
    </form>
  );
}
