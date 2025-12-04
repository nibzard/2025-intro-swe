import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Pin } from 'lucide-react';

// Revalidate every 30 seconds
export const revalidate = 30;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Get category
  const { data: category } = await (supabase as any)
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // Get topics in this category
  const { data: topics } = await (supabase as any)
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url),
      category:categories(name, slug, color)
    `)
    .eq('category_id', category.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="text-4xl flex items-center justify-center w-16 h-16 rounded-lg"
              style={{ backgroundColor: category.color + '20' }}
            >
              {category.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {category.description}
              </p>
            </div>
          </div>
        </div>
        <Link href="/forum/new">
          <Button>Nova tema</Button>
        </Link>
      </div>

      {topics && topics.length > 0 ? (
        <div className="space-y-3">
          {topics.map((topic: any) => (
            <Card key={topic.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {topic.is_pinned && (
                        <Pin className="w-4 h-4 text-yellow-500" />
                      )}
                      {topic.is_locked && (
                        <span className="text-gray-400">🔒</span>
                      )}
                    </div>
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="text-xl font-semibold hover:text-blue-600 transition-colors block"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <span>
                        od {(topic.author as any)?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {topic.reply_count} odgovora
                      </span>
                      <span>
                        {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                      </span>
                      {topic.last_reply_at && (
                        <span className="text-gray-400">
                          zadnji odgovor {new Date(topic.last_reply_at).toLocaleDateString('hr-HR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{topic.view_count}</div>
                    <div className="text-xs text-gray-500">pregleda</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">
              Nema još tema u ovoj kategoriji. Budi prvi i stvori novu!
            </p>
            <Link href="/forum/new">
              <Button className="mt-4">Stvori prvu temu</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
