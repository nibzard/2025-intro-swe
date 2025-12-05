import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ForumPage() {
  const supabase = await createServerSupabaseClient();

  // Get categories with topic count
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  // Get topic counts for each category
  const categoryData = await Promise.all(
    (categories || []).map(async (category: any) => {
      const { count: topicCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      const { data: latestTopic } = await supabase
        .from('topics')
        .select('id, title, slug, created_at, author:profiles!topics_author_id_fkey(username)')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...category,
        topic_count: topicCount || 0,
        latest_topic: latestTopic,
      };
    })
  );

  // Get recent topics
  const { data: recentTopics } = await supabase
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url),
      category:categories(name, slug, color)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Forum Kategorije</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Pridruži se diskusijama i postavi svoja pitanja
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {categoryData.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    className="text-3xl sm:text-4xl flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/forum/category/${category.slug}`}>
                      <h3 className="text-lg sm:text-xl font-semibold hover:text-blue-600 transition-colors truncate">
                        {category.name}
                      </h3>
                    </Link>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                    {category.latest_topic && (
                      <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500 line-clamp-1">
                        Zadnja:{' '}
                        <Link
                          href={`/forum/topic/${category.latest_topic.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          {category.latest_topic.title}
                        </Link>
                        <span className="hidden sm:inline">
                          {' od '}{(category.latest_topic.author as any)?.username}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {category.topic_count}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">tema</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 sm:mt-12">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <h2 className="text-xl sm:text-2xl font-bold">Nedavne Teme</h2>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {recentTopics?.map((topic: any) => (
            <Card key={topic.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 sm:py-1 text-xs font-semibold rounded flex-shrink-0"
                      style={{
                        backgroundColor: (topic.category as any)?.color + '20',
                        color: (topic.category as any)?.color,
                      }}
                    >
                      {(topic.category as any)?.name}
                    </span>
                    {topic.is_pinned && (
                      <span className="text-sm">📌</span>
                    )}
                  </div>
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="text-base sm:text-lg font-semibold hover:text-blue-600 transition-colors block line-clamp-2"
                  >
                    {topic.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {(topic.author as any)?.username}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      {topic.reply_count}
                    </span>
                    <span className="hidden xs:inline flex-shrink-0">
                      {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
