'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';

export default function NewTopicPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadCategories() {
      const { data } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (data) {
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    }
    loadCategories();
  }, []);

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

    router.push(`/forum/topic/${slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/forum">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na forum
          </Button>
        </Link>
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
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Opiši svoju temu detaljno..."
                rows={12}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/forum">
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Odustani
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Stvaranje...' : 'Stvori temu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
