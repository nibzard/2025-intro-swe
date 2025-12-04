import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TrendingUp, Users, MessageSquare, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAnalytics() {
  const supabase = await createServerSupabaseClient();

  // Get category statistics
  const { data: categoryStats } = await supabase
    .from('topics')
    .select(
      `
      category_id,
      category:categories(name, color)
    `
    )
    .order('category_id');

  const categoryCounts = categoryStats?.reduce((acc: any, topic: any) => {
    const categoryName = topic.category?.name || 'Unknown';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {});

  // Get daily activity for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentTopics } = await supabase
    .from('topics')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: recentReplies } = await supabase
    .from('replies')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get most viewed topics
  const { data: topTopics } = await supabase
    .from('topics')
    .select(
      `
      title,
      slug,
      view_count,
      reply_count,
      author:profiles!topics_author_id_fkey(username)
    `
    )
    .order('view_count', { ascending: false })
    .limit(10);

  // Get most replied topics
  const { data: mostReplied } = await supabase
    .from('topics')
    .select(
      `
      title,
      slug,
      reply_count,
      view_count,
      author:profiles!topics_author_id_fkey(username)
    `
    )
    .order('reply_count', { ascending: false })
    .limit(10);

  return {
    categoryCounts: Object.entries(categoryCounts || {}).map(([name, count]) => ({
      name,
      count,
    })),
    recentActivity: {
      topics: recentTopics?.length || 0,
      replies: recentReplies?.length || 0,
      users: recentUsers?.length || 0,
    },
    topTopics: topTopics || [],
    mostReplied: mostReplied || [],
  };
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Detailed insights and statistics about your forum
        </p>
      </div>

      {/* Last 30 Days Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Last 30 Days Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recentActivity.users}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New Topics</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recentActivity.topics}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">New Replies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.recentActivity.replies}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topics by Category */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Topics by Category
        </h2>
        <div className="space-y-3">
          {analytics.categoryCounts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No data available
            </p>
          ) : (
            analytics.categoryCounts.map((category: any) => (
              <div key={category.name} className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">{category.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (category.count /
                            Math.max(
                              ...analytics.categoryCounts.map((c: any) => c.count)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {category.count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Most Viewed Topics
          </h2>
          <div className="space-y-3">
            {analytics.topTopics.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No topics yet
              </p>
            ) : (
              analytics.topTopics.map((topic: any, index) => (
                <div
                  key={topic.slug}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/forum/topic/${topic.slug}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                    >
                      {topic.title}
                    </a>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {topic.view_count}
                      </span>
                      <span>{topic.reply_count} replies</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Replied Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Most Replied Topics
          </h2>
          <div className="space-y-3">
            {analytics.mostReplied.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No topics yet
              </p>
            ) : (
              analytics.mostReplied.map((topic: any, index) => (
                <div
                  key={topic.slug}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/forum/topic/${topic.slug}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                    >
                      {topic.title}
                    </a>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{topic.reply_count} replies</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {topic.view_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
