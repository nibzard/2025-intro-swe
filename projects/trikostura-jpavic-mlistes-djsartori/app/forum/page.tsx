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
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Forum Kategorije</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Pridruži se diskusijama i postavi svoja pitanja
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6">
        {categoryData.map((category) => (
          <div
            key={category.id}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300`} style={{ backgroundImage: `linear-gradient(to bottom right, ${category.color}, ${category.color}88)` }}></div>
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                <div
                  className="text-5xl flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/forum/category/${category.slug}`}>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
                      {category.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {category.description}
                  </p>
                  {category.latest_topic && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                        Zadnja tema
                      </span>
                      <Link
                        href={`/forum/topic/${category.latest_topic.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium truncate"
                      >
                        {category.latest_topic.title}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {(category.latest_topic.author as any)?.username}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl min-w-[100px]">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {category.topic_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">tema</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Topics Section */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nedavne Teme</h2>
        </div>
        <div className="space-y-4">
          {recentTopics?.map((topic: any) => (
            <div
              key={topic.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-3 py-1 text-sm font-semibold rounded-full"
                      style={{
                        backgroundColor: (topic.category as any)?.color + '20',
                        color: (topic.category as any)?.color,
                      }}
                    >
                      {(topic.category as any)?.name}
                    </span>
                    {topic.is_pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                        📌 Prikvačeno
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block mb-3 group-hover:translate-x-1 transform duration-200"
                  >
                    {topic.title}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {(topic.author as any)?.username}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold">{topic.reply_count}</span> odgovora
                    </span>
                    <span>{new Date(topic.created_at).toLocaleDateString('hr-HR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
