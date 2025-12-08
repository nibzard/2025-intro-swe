'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;

interface EditTopicClientProps {
  topic: {
    id: string;
    slug: string;
    title: string;
    content: string;
    author: { username: string } | null;
  };
}

export function EditTopicClient({ topic }: EditTopicClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(topic.title);
  const [content, setContent] = useState(topic.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Naslov je obavezan');
      toast.error('Naslov je obavezan');
      return;
    }

    if (!content.trim()) {
      setError('Sadrzaj je obavezan');
      toast.error('Sadrzaj je obavezan');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Spremam promjene...');

    try {
      const supabase = createClient();

      const { error: updateError } = await (supabase as any)
        .from('topics')
        .update({
          title: title.trim(),
          content: content.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', topic.id);

      if (updateError) throw updateError;

      toast.success('Tema uspjesno uredena!', { id: loadingToast });
      router.push(`/forum/topic/${topic.slug}`);
      router.refresh();
    } catch (err: any) {
      console.error('Error updating topic:', err);
      setError(err.message || 'Doslo je do greske');
      toast.error(err.message || 'Doslo je do greske pri spremanju', { id: loadingToast });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
      <div className="mb-6">
        <Link
          href={`/forum/topic/${topic.slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Natrag na temu
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Uredi temu
        </h1>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Naslov teme <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Naslov teme"
                maxLength={MAX_TITLE_LENGTH}
                className="text-lg h-12"
                required
              />
              <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
                <p>
                  <span className={title.length > MAX_TITLE_LENGTH * 0.9 ? 'text-orange-500' : ''}>
                    {title.length}
                  </span>
                  /{MAX_TITLE_LENGTH}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <Label className="text-base font-semibold mb-3 block">
              Sadrzaj <span className="text-red-500">*</span>
            </Label>
            <EnhancedMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Sadrzaj teme..."
              maxLength={MAX_CONTENT_LENGTH}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="flex-1 sm:flex-none h-11 sm:px-8"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Spremam...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spremi promjene
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="sm:ml-auto h-11"
          >
            Odustani
          </Button>
        </div>
      </form>
    </div>
  );
}
