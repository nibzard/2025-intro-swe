'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedMarkdownEditor } from '@/components/forum/new/enhanced-markdown-editor';
import { EnhancedFileUpload } from '@/components/forum/new/enhanced-file-upload';
import { AutoSaveIndicator, SaveStatus } from '@/components/forum/new/auto-save-indicator';
import { ArrowLeft, Send, Save, AlertCircle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments';
import { generateSlug } from '@/lib/utils';
import { processMentions } from '@/app/forum/actions';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import { toast } from 'sonner';
import Link from 'next/link';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const AUTOSAVE_DELAY = 3000; // 3 seconds

export function CreateTopicPage({ categories, tags, initialDraft }: any) {
  const router = useRouter();
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [content, setContent] = useState(initialDraft?.content || '');
  const [categoryId, setCategoryId] = useState(initialDraft?.category_id || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialDraft?.tags || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(initialDraft?.updated_at ? new Date(initialDraft.updated_at) : null);
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id || null);
  const [error, setError] = useState('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-save draft
  const saveDraft = useCallback(async () => {
    if (!title && !content) return;

    setSaveStatus('saving');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveStatus('error');
      return;
    }

    try {
      const draftData = {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId || null,
        tags: selectedTags,
        author_id: user.id,
      };

      if (draftId) {
        // Update existing draft
        const { error } = await (supabase as any).from('topic_drafts').update(draftData).eq('id', draftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await (supabase as any)
          .from('topic_drafts')
          .insert(draftData)
          .select()
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving draft:', err);
      setSaveStatus('error');
    }
  }, [title, content, categoryId, selectedTags, draftId]);

  // Auto-save on changes
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (title || content) {
      setSaveStatus('idle');
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, categoryId, selectedTags, saveDraft]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((title || content) && saveStatus !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, content, saveStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Naslov je obavezan');
      toast.error('Naslov je obavezan');
      return;
    }

    if (!content.trim()) {
      setError('Sadržaj je obavezan');
      toast.error('Sadržaj je obavezan');
      return;
    }

    if (!categoryId) {
      setError('Molimo odaberite kategoriju');
      toast.error('Molimo odaberite kategoriju');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Objavljujem temu...');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Morate biti prijavljeni');
      }

      // Create topic
      const { data: topic, error: topicError } = await (supabase as any)
        .from('topics')
        .insert({
          title: title.trim(),
          slug: generateSlug(title.trim()),
          content: content.trim(),
          category_id: categoryId,
          author_id: user.id,
        })
        .select()
        .single();

      if (topicError) {
        console.error('Topic creation error:', topicError);
        throw new Error(topicError.message || 'Greška pri kreiranju teme');
      }

      if (!topic) {
        throw new Error('Tema nije kreirana. Pokušajte ponovno.');
      }

      // Add tags
      if (selectedTags.length > 0 && topic) {
        const tagInserts = selectedTags.map((tagId) => ({
          topic_id: topic.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await (supabase as any).from('topic_tags').insert(tagInserts);
        if (tagError) console.error('Error adding tags:', tagError);
      }

      // Upload attachments
      if (selectedFiles.length > 0 && topic) {
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
          }
        }
      }

      // Process mentions and create notifications
      await processMentions(content.trim(), user.id, topic.id);

      // Delete draft if exists
      if (draftId) {
        await (supabase as any).from('topic_drafts').delete().eq('id', draftId);
      }

      toast.success('Tema uspješno objavljena!', { id: loadingToast });
      router.push(`/forum/topic/${topic.slug}`);
    } catch (err: any) {
      console.error('Error creating topic:', err);
      setError(err.message || 'Došlo je do greške');
      toast.error(err.message || 'Došlo je do greške pri objavi teme', { id: loadingToast });
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Forum', href: '/forum' },
          { label: 'Nova tema' },
        ]}
      />

      {/* Header */}
      <div className="mb-6 mt-6">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Natrag na forum
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
              Nova tema
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Podijeli svoje znanje ili postavi pitanje zajednici
            </p>
          </div>

          <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
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
                placeholder="O čemu želiš razgovarati?"
                maxLength={MAX_TITLE_LENGTH}
                className="text-lg h-12"
                required
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <p>Budi jasan i konkretan</p>
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

        {/* Category & Tags */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <Label htmlFor="category" className="text-base font-semibold">
                Kategorija <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-2 w-full h-11 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Odaberi kategoriju</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{selectedCategory.description}</p>
              )}
            </div>

            {tags.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-2 block">Oznake (opcionalno)</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: any) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Label className="text-base font-semibold mb-3 block">
              Sadržaj <span className="text-red-500">*</span>
            </Label>
            <EnhancedMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Opiši detaljno svoje pitanje ili temu..."
              maxLength={MAX_CONTENT_LENGTH}
              onSave={saveDraft}
            />
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Label className="text-base font-semibold mb-3 block">Prilozi (opcionalno)</Label>
            <EnhancedFileUpload files={selectedFiles} onChange={setSelectedFiles} maxFiles={5} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t dark:border-gray-800 -mx-3 sm:-mx-4">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
            className="flex-1 sm:flex-none h-11 sm:px-8"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Objavljujem...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Objavi temu
              </>
            )}
          </Button>

          <Button type="button" variant="outline" onClick={saveDraft} disabled={saveStatus === 'saving'} className="flex-1 sm:flex-none h-11">
            <Save className="w-4 h-4 mr-2" />
            Spremi nacrt
          </Button>

          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting} className="sm:ml-auto h-11">
            Odustani
          </Button>
        </div>
      </form>
    </div>
  );
}
