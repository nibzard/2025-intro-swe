import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Users, MessageSquare, MessagesSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getAdminStats() {
  const supabase = await createServerSupabaseClient();

  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get total topics
  const { count: totalTopics } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });

  // Get total replies
  const { count: totalReplies } = await supabase
    .from('replies')
    .select('*', { count: 'exact', head: true });

  // Get users registered in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  // Get recent topics
  const { data: recentTopics } = await supabase
    .from('topics')
    .select(
      `
      *,
      author:profiles!topics_author_id_fkey(username, full_name),
      category:categories(name, color)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5);

  // Get most active users
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id, username, full_name, reputation')
    .order('reputation', { ascending: false })
    .limit(5);

  return {
    totalUsers: totalUsers || 0,
    totalTopics: totalTopics || 0,
    totalReplies: totalReplies || 0,
    newUsers: newUsers || 0,
    recentTopics: recentTopics || [],
    activeUsers: activeUsers || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: 'Ukupno Korisnika',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${stats.newUsers} ovaj tjedan`,
    },
    {
      title: 'Ukupno Tema',
      value: stats.totalTopics,
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Ukupno Odgovora',
      value: stats.totalReplies,
      icon: MessagesSquare,
      color: 'bg-purple-500',
    },
    {
      title: 'Prosječno Odgovora/Temi',
      value: stats.totalTopics > 0
        ? (stats.totalReplies / stats.totalTopics).toFixed(1)
        : '0',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Administratorska Nadzorna Ploča
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Dobrodošli na administratorsku ploču. Upravljajte svojim forumom odavde.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Nedavne Teme
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {stats.recentTopics.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nema tema još
              </p>
            ) : (
              stats.recentTopics.map((topic: any) => (
                <div
                  key={topic.id}
                  className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="inline-block px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: topic.category?.color + '20',
                          color: topic.category?.color,
                        }}
                      >
                        {topic.category?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {topic.author?.username}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {topic.reply_count} odgovora
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/admin/topics"
            className="block text-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Pogledaj sve teme →
          </Link>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Najbolji Korisnici po Reputaciji
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {stats.activeUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nema korisnika još
              </p>
            ) : (
              stats.activeUsers.map((user: any, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/user/${user.username}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {user.full_name || user.username}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user.reputation}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/admin/users"
            className="block text-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Pogledaj sve korisnike →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Brze Akcije
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-center">
              Upravljaj Korisnicima
            </span>
          </Link>
          <Link
            href="/admin/topics"
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
          >
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-center">
              Moderiraj Teme
            </span>
          </Link>
          <Link
            href="/admin/categories"
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
          >
            <MessagesSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-center">
              Uredi Kategorije
            </span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
          >
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-center">
              Pregledaj Analitiku
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
