import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp, Flame, CheckCircle, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Category, Topic, Profile } from '@/types/database';
import { TopicListClient } from '@/components/forum/topic-list-client';

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

// Revalidate every 120 seconds (2 minutes) for better cache performance
export const revalidate = 120;

const TOPICS_PER_PAGE = 15;

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const { page, filter } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  const currentFilter = filter || 'all'; // all, solved, unsolved
  const offset = (currentPage - 1) * TOPICS_PER_PAGE;

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

  // Get trending topics (most views + replies in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: trendingTopics } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      slug,
      view_count,
      reply_count,
      created_at,
      author:profiles!topics_author_id_fkey(username, avatar_url),
      category:categories(name, slug, color)
    `)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('view_count', { ascending: false })
    .limit(5);

  // Get recent topics (without server-side filtering for instant client-side switching)
  const { data: recentTopics, count: totalTopics } = await supabase
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url),
      category:categories(name, slug, color)
    `, { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + TOPICS_PER_PAGE - 1);

  // Calculate solved and unsolved counts for client-side filtering
  const solvedCount = recentTopics?.filter((t: any) => t.has_solution === true).length || 0;
  const unsolvedCount = recentTopics?.filter((t: any) => !t.has_solution).length || 0;

  const totalPages = Math.ceil((totalTopics || 0) / TOPICS_PER_PAGE);

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

      {/* Trending Topics Section */}
      {trendingTopics && trendingTopics.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Popularno</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(trendingTopics as unknown as TopicWithCategoryAndAuthor[])?.slice(0, 3).map((topic, index) => (
              <Card key={topic.id} className="hover-lift cursor-pointer border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl font-bold text-orange-500/50">#{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/forum/topic/${topic.slug}`}
                        className="text-sm sm:text-base font-bold hover:text-primary transition-colors block line-clamp-2 text-gray-900 dark:text-white"
                      >
                        {topic.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{topic.view_count} pregleda</span>
                        <span>•</span>
                        <span>{topic.reply_count} odgovora</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Topics Section with Client-Side Filtering */}
      <div className="mt-8 sm:mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sve Teme</h2>
        </div>

        <TopicListClient
          topics={(recentTopics || []) as any}
          totalCount={recentTopics?.length || 0}
          solvedCount={solvedCount}
          unsolvedCount={unsolvedCount}
        />
      </div>
    </div>
  );
}
