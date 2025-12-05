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
    .eq('category_id', (category as any).id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Category Header with gradient */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 border-2" style={{ backgroundColor: category.color + '10', borderColor: category.color + '40' }}>
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div
              className="text-6xl flex items-center justify-center w-24 h-24 rounded-2xl shadow-2xl"
              style={{ backgroundColor: category.color + '30' }}
            >
              {category.icon}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                {category.name}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                {category.description}
              </p>
            </div>
          </div>
          <Link href="/forum/new">
            <Button className="px-6 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              Nova tema
            </Button>
          </Link>
        </div>
      </div>

      {/* Topics List */}
      {topics && topics.length > 0 ? (
        <div className="space-y-4">
          {topics.map((topic: any) => (
            <div
              key={topic.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {topic.is_pinned && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-semibold">
                        <Pin className="w-4 h-4" />
                        Prikvačeno
                      </span>
                    )}
                    {topic.is_locked && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
                        🔒 Zaključano
                      </span>
                    )}
                  </div>

                  {/* Topic title */}
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block mb-3 group-hover:translate-x-1 transform duration-200"
                  >
                    {topic.title}
                  </Link>

                  {/* Topic meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    <span className="font-medium">
                      {(topic.author as any)?.username}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold">{topic.reply_count}</span> odgovora
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                    </span>
                    {topic.last_reply_at && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          zadnji odgovor {new Date(topic.last_reply_at).toLocaleDateString('hr-HR')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* View count */}
                <div className="flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl min-w-[100px]">
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    {topic.view_count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">pregleda</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-12 md:p-16 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="relative">
            <div className="text-6xl mb-6">💭</div>
            <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Nema još tema u ovoj kategoriji
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Budi prvi i stvori novu temu!
            </p>
            <Link href="/forum/new">
              <Button className="px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                Stvori prvu temu
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
