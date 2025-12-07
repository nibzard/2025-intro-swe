import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import type { Category, Topic, Profile } from '@/types/database';

interface TopicWithAuthor extends Topic {
  author: Profile | null;
}

interface TopicMinimal {
  id: string;
  category_id: string;
  created_at: string;
}

interface LatestTopicData {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  category_id: string;
  author: Pick<Profile, 'username'> | null;
}

interface CategoryWithStats extends Category {
  topic_count: number;
  latest_topic: LatestTopicData | null;
}

interface TopicWithCategoryAndAuthor extends Topic {
  category: Pick<Category, 'name' | 'slug' | 'color'> | null;
  author: Pick<Profile, 'username' | 'avatar_url'> | null;
}

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ForumPage() {
  const supabase = await createServerSupabaseClient();

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  // Get all topics with minimal data for counting (single query)
  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, category_id, created_at');

  // Get recent topics per category for "latest topic" display (single query)
  const { data: recentTopicsByCategory } = await supabase
    .from('topics')
    .select('id, title, slug, created_at, category_id, author:profiles!topics_author_id_fkey(username)')
    .order('created_at', { ascending: false })
    .limit(100); // Get enough to ensure we have latest for each category

  // Build maps for efficient lookup
  const topicCountByCategory = new Map<string, number>();
  const latestTopicByCategory = new Map<string, LatestTopicData>();

  // Count topics per category
  allTopics?.forEach((topic: TopicMinimal) => {
    topicCountByCategory.set(
      topic.category_id,
      (topicCountByCategory.get(topic.category_id) || 0) + 1
    );
  });

  // Find latest topic per category
  (recentTopicsByCategory as unknown as LatestTopicData[])?.forEach((topic) => {
    if (!latestTopicByCategory.has(topic.category_id)) {
      latestTopicByCategory.set(topic.category_id, topic);
    }
  });

  // Combine category data with counts and latest topics
  const categoryData: CategoryWithStats[] = (categories as Category[] || []).map((category) => ({
    ...category,
    topic_count: topicCountByCategory.get(category.id) || 0,
    latest_topic: latestTopicByCategory.get(category.id) || null,
  }));

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Forum Kategorije</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Pridruži se diskusijama i postavi svoja pitanja
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {categoryData.map((category) => (
          <Card key={category.id} className="hover-lift cursor-pointer border-gray-200 dark:border-gray-700">
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
                      <h3 className="text-lg sm:text-xl font-bold hover:text-primary transition-colors truncate text-gray-900 dark:text-white">
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
                          className="text-primary hover:underline font-medium"
                        >
                          {category.latest_topic.title}
                        </Link>
                        <span className="hidden sm:inline">
                          {' od '}{category.latest_topic.author?.username}
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
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Nedavne Teme</h2>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {(recentTopics as unknown as TopicWithCategoryAndAuthor[])?.map((topic) => (
            <Card key={topic.id} className="hover-lift cursor-pointer border-gray-200 dark:border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 sm:py-1 text-xs font-semibold rounded flex-shrink-0"
                      style={{
                        backgroundColor: topic.category?.color ? topic.category.color + '20' : undefined,
                        color: topic.category?.color || undefined,
                      }}
                    >
                      {topic.category?.name}
                    </span>
                    {topic.is_pinned && (
                      <span className="text-sm">📌</span>
                    )}
                  </div>
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="text-base sm:text-lg font-bold hover:text-primary transition-colors block line-clamp-2 text-gray-900 dark:text-white"
                  >
                    {topic.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {topic.author?.username}
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
