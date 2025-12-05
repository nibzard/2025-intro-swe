import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearch } from '@/components/forum/user-search';
import { Trophy, TrendingUp, Users, Star, Calendar, MessageSquare, FileText, Award } from 'lucide-react';

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();

  // Get total stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalTopics } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });

  const { count: totalReplies } = await supabase
    .from('replies')
    .select('*', { count: 'exact', head: true });

  // Top contributors by reputation
  const { data: topByReputation } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, reputation, role, created_at')
    .order('reputation', { ascending: false })
    .limit(10);

  // Most active users (by topic + reply count)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, reputation, role, created_at');

  // Calculate activity for each user
  const usersWithActivity = await Promise.all(
    (allUsers || []).map(async (user: any) => {
      const { count: topicCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      const { count: replyCount } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      return {
        ...user,
        topic_count: topicCount || 0,
        reply_count: replyCount || 0,
        total_activity: (topicCount || 0) + (replyCount || 0),
      };
    })
  );

  const mostActive = usersWithActivity
    .sort((a, b) => b.total_activity - a.total_activity)
    .slice(0, 10);

  const newestMembers = usersWithActivity
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
          Zajednica Studenata
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Upoznaj aktivne članove naše zajednice
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Ukupno Korisnika
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {totalUsers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Ukupno Tema
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {totalTopics || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Ukupno Odgovora
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {totalReplies || 0}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top by Reputation */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top po Reputaciji
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Korisnici s najviše reputacije
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {topByReputation?.map((user: any, index: number) => (
                <Link
                  key={user.id}
                  href={`/forum/user/${user.username}`}
                  className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 sm:w-8 text-center">
                    {index === 0 && <span className="text-xl sm:text-2xl">🥇</span>}
                    {index === 1 && <span className="text-xl sm:text-2xl">🥈</span>}
                    {index === 2 && <span className="text-xl sm:text-2xl">🥉</span>}
                    {index > 2 && (
                      <span className="text-sm sm:text-base font-semibold text-gray-400">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-semibold truncate">
                        {user.username}
                      </p>
                      {user.role === 'admin' && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    {user.full_name && (
                      <p className="text-xs text-gray-500 truncate">{user.full_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <span className="text-sm sm:text-base font-semibold">
                      {user.reputation}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Najaktivniji Korisnici
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Najviše tema i odgovora
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {mostActive?.map((user: any, index: number) => (
                <Link
                  key={user.id}
                  href={`/forum/user/${user.username}`}
                  className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 sm:w-8 text-center">
                    <span className="text-sm sm:text-base font-semibold text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-semibold truncate">
                        {user.username}
                      </p>
                      {user.role === 'admin' && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {user.topic_count} tema · {user.reply_count} odgovora
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base font-semibold">
                      {user.total_activity}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newest Members */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="w-5 h-5 text-blue-500" />
            Novi Članovi
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Dobrodošli u našu zajednicu!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {newestMembers?.slice(0, 10).map((user: any) => (
              <Link
                key={user.id}
                href={`/forum/user/${user.username}`}
                className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-2">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm sm:text-base font-semibold text-center truncate w-full">
                  {user.username}
                </p>
                {user.role === 'admin' && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded mt-1">
                    Admin
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(user.created_at).toLocaleDateString('hr-HR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Users with Search */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Svi Korisnici</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Pretražite i filtrirajte korisnike
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <UserSearch users={usersWithActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
