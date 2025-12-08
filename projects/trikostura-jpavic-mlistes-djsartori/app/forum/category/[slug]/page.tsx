import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { MessageSquare, Pin, CheckCircle } from 'lucide-react';

// Revalidate every 30 seconds
export const revalidate = 30;

const TOPICS_PER_PAGE = 20;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));
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

  // Get total count for pagination
  const { count: totalCount } = await (supabase as any)
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', (category as any).id);

  const totalPages = Math.ceil((totalCount || 0) / TOPICS_PER_PAGE);
  const offset = (currentPage - 1) * TOPICS_PER_PAGE;

  // Get topics in this category with pagination
  const { data: topics } = await (supabase as any)
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url),
      category:categories(name, slug, color)
    `)
    .eq('category_id', (category as any).id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + TOPICS_PER_PAGE - 1);

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div
              className="text-3xl sm:text-4xl flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex-shrink-0"
              style={{ backgroundColor: category.color + '20' }}
            >
              {category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{category.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {category.description}
              </p>
            </div>
          </div>
        </div>
        <Link href="/forum/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Nova tema</Button>
        </Link>
      </div>

      {/* Topic count */}
      <div className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? 'tema' : 'tema'} ukupno
        {totalPages > 1 && ` - Stranica ${currentPage} od ${totalPages}`}
      </div>

      {topics && topics.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {topics.map((topic: any) => (
            <Card key={topic.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                      {topic.is_pinned && (
                        <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      {topic.is_locked && (
                        <span className="text-sm sm:text-base text-gray-400 dark:text-gray-500">🔒</span>
                      )}
                      {topic.has_solution && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Rijeseno
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="text-base sm:text-xl font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors block line-clamp-2"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        od {(topic.author as any)?.username}
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        {topic.reply_count}
                      </span>
                      <span className="hidden sm:inline">
                        {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                      </span>
                      {topic.last_reply_at && (
                        <span className="hidden md:inline text-gray-400 dark:text-gray-500">
                          zadnji: {new Date(topic.last_reply_at).toLocaleDateString('hr-HR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{topic.view_count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">pregleda</div>
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
              Nema jos tema u ovoj kategoriji. Budi prvi i stvori novu!
            </p>
            <Link href="/forum/new">
              <Button className="mt-4">Stvori prvu temu</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={`/forum/category/${slug}`}
      />
    </div>
  );
}
