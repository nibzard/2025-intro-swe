'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/forum/markdown-editor';
import { AdvancedFileUpload } from '@/components/forum/advanced-file-upload';
import { FormattingToolbar } from '@/components/forum/formatting-toolbar';
import { TopicPreviewModal } from '@/components/forum/topic-preview-modal';
import { createClient } from '@/lib/supabase/client';
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments';
import { ArrowLeft, Eye, Save, Send } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NewTopicPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load categories
      const { data: categoriesData } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      }

      // Load tags
      const { data: tagsData } = await (supabase as any)
        .from('tags')
        .select('*')
        .order('name');

      if (tagsData) {
        setTags(tagsData);
      }

      // Try to load existing draft
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: draftData } = await (supabase as any)
          .from('topic_drafts')
          .select('*')
          .eq('author_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (draftData) {
          setTitle(draftData.title || '');
          setContent(draftData.content || '');
          if (draftData.category_id) setCategoryId(draftData.category_id);
          setDraftId(draftData.id);
          setLastSaved(new Date(draftData.updated_at));
        }
      }
    }
    loadData();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (title || content) {
        handleSaveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, content, categoryId]);

  async function handleSaveDraft() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    setIsSavingDraft(true);

    const draftData = {
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId || null,
      author_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (draftId) {
      // Update existing draft
      await (supabase as any)
        .from('topic_drafts')
        .update(draftData)
        .eq('id', draftId);
    } else {
      // Create new draft
      const { data } = await (supabase as any)
        .from('topic_drafts')
        .insert(draftData)
        .select()
        .single();

      if (data) {
        setDraftId(data.id);
      }
    }

    setLastSaved(new Date());
    setIsSavingDraft(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Naslov ne može biti prazan');
      return;
    }

    if (!content.trim()) {
      setError('Sadržaj ne može biti prazan');
      return;
    }

    if (!categoryId) {
      setError('Odaberite kategoriju');
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

    // Create slug from title
    const slug =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now();

    const { error: insertError, data: newTopic } = await (supabase as any)
      .from('topics')
      .insert({
        title: title.trim(),
        slug,
        content: content.trim(),
        category_id: categoryId,
        author_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      setError('Greška pri stvaranju teme');
      setIsSubmitting(false);
      return;
    }

    // Add tags
    if (selectedTags.length > 0) {
      const tagInserts = selectedTags.map(tagId => ({
        topic_id: newTopic.id,
        tag_id: tagId,
      }));

      await (supabase as any).from('topic_tags').insert(tagInserts);
    }

    // Upload attachments if any
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const { url, error: uploadError } = await uploadAttachment(file, user.id);

        if (uploadError || !url) {
          console.error('Failed to upload file:', file.name, uploadError);
          continue;
        }

        // Save attachment metadata
        await saveAttachmentMetadata(
          url,
          file.name,
          file.size,
          file.type,
          user.id,
          newTopic.id,
          'topic'
        );
      }
    }

    // Delete draft if exists
    if (draftId) {
      await (supabase as any).from('topic_drafts').delete().eq('id', draftId);
    }

    router.push(`/forum/topic/${slug}`);
  }

  function handleFormatInsert(before: string, after?: string) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + (after || '');

    setContent(
      content.substring(0, start) + newText + content.substring(end)
    );

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedTagsData = tags.filter(t => selectedTags.includes(t.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/forum">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na forum
          </Button>
        </Link>

        {lastSaved && (
          <span className="text-xs text-gray-500">
            {isSavingDraft ? 'Spremanje...' : `Zadnje spremljeno: ${lastSaved.toLocaleTimeString()}`}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stvori novu temu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Kategorija</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Oznake (opcionalno)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      if (selectedTags.includes(tag.id)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag.id));
                      } else {
                        setSelectedTags([...selectedTags, tag.id]);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'ring-2 ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Naslov teme</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Upiši naslov teme..."
                disabled={isSubmitting}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Sadržaj</Label>
              <FormattingToolbar onInsert={handleFormatInsert} />
              <MarkdownEditor
                ref={contentRef}
                value={content}
                onChange={setContent}
                placeholder="Opiši svoju temu detaljno... (Markdown podržan)"
                rows={12}
                name="content"
              />
            </div>

            <div className="space-y-2">
              <Label>Datoteke</Label>
              <AdvancedFileUpload onFilesChange={setSelectedFiles} maxFiles={5} />
            </div>

            <div className="flex justify-between gap-3">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={!title && !content}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Pregled
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || (!title && !content)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingDraft ? 'Spremanje...' : 'Spremi skicu'}
                </Button>
              </div>

              <div className="flex gap-3">
                <Link href="/forum">
                  <Button variant="outline" type="button" disabled={isSubmitting}>
                    Odustani
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Objavljujem...' : 'Objavi temu'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {showPreview && (
        <TopicPreviewModal
          title={title}
          content={content}
          category={selectedCategory || null}
          tags={selectedTagsData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
