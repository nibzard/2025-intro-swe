'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { EnhancedFileUpload } from '@/components/forum/new/enhanced-file-upload';
import { ArrowLeft, Save, AlertCircle, Eye, Edit3, Lightbulb, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import { toast } from 'sonner';
import { useButtonAnimation } from '@/hooks/use-button-animation';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import { useEffect } from 'react';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const { triggerAnimation, animationClasses } = useButtonAnimation();

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Morate biti prijavljeni');
      }

      const { error: updateError } = await (supabase as any)
        .from('topics')
        .update({
          title: title.trim(),
          content: content.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', topic.id);

      if (updateError) throw updateError;

      // Upload new attachments if any
      if (selectedFiles.length > 0) {
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
                topic.id,
                'topic'
              );
            }
          } catch (err) {
            console.error('Error uploading file:', err);
            toast.warning(`Nije uspjelo učitavanje: ${file.name}`);
          }
        }
      }

      triggerAnimation();
      toast.success('Tema uspješno uređena!', { id: loadingToast });
      router.push(`/forum/topic/${topic.slug}`);
      router.refresh();
    } catch (err: any) {
      console.error('Error updating topic:', err);
      setError(err.message || 'Doslo je do greske');
      toast.error(err.message || 'Doslo je do greske pri spremanju', { id: loadingToast });
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSubmitting && title.trim() && content.trim()) {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        } else {
          toast.error('Molimo ispunite sva obavezna polja');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content, isSubmitting]);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Forum', href: '/forum' },
          { label: topic.title, href: `/forum/topic/${topic.slug}` },
          { label: 'Uredi' },
        ]}
      />

      <div className="mb-6 mt-6">
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
        {/* Tips Panel */}
        {showTips && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Savjeti za uređivanje
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong>Provjeri sadržaj:</strong> Koristi pregled za provjeru formatiranja</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong>Označi izmjene:</strong> Jasno navedi što si promijenio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span><strong>Prečac:</strong> Ctrl+S za brzo spremanje</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Zatvori savjete"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
                Sadrzaj <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {!showTips && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTips(true)}
                    className="text-xs h-7"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Savjeti
                  </Button>
                )}
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
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
                    className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
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
              <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                    Nema sadržaja za prikaz. Pređi na način uređivanja da napišeš sadržaj.
                  </p>
                )}
              </div>
            ) : (
              <EnhancedMarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="Sadrzaj teme..."
                maxLength={MAX_CONTENT_LENGTH}
              />
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Label className="text-base font-semibold mb-3 block">Dodaj nove priloge (opcionalno)</Label>
            <EnhancedFileUpload files={selectedFiles} onChange={setSelectedFiles} maxFiles={5} />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`flex-1 sm:flex-none h-11 sm:px-8 ${animationClasses}`}
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
