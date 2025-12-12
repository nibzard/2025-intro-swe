import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModerationClient } from './moderation-client';
import { Shield, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    redirect('/forum');
  }

  // Get banned words
  const { data: bannedWords } = await supabase
    .from('banned_words')
    .select('*')
    .order('severity', { ascending: false })
    .order('word', { ascending: true });

  // Get moderation stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalBlocked },
    { count: totalFlagged },
    { count: blockedToday },
    { data: recentLogs },
  ] = await Promise.all([
    supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'block'),
    supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'auto_flag'),
    supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'block')
      .gte('created_at', today.toISOString()),
    supabase
      .from('moderation_logs')
      .select('*, user:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const stats = {
    totalBlocked: totalBlocked || 0,
    totalFlagged: totalFlagged || 0,
    blockedToday: blockedToday || 0,
    totalWords: bannedWords?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Moderacija Sadržaja</h1>
          <p className="text-sm text-gray-500">
            Upravljaj filterom neprikladnog sadržaja
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Blokirani Pokušaji
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalBlocked}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Auto-Flagged
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalFlagged}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Danas Blokirano</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.blockedToday}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Blokirane Riječi
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalWords}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Nedavna Aktivnost</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          log.action === 'block'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}
                      >
                        {log.action === 'block' ? 'Blokirano' : 'Označeno'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          log.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : log.severity === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {log.content_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Korisnik: <span className="font-medium">{log.user?.username || 'Unknown'}</span>
                    </p>
                    {log.matched_words && log.matched_words.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Pronađene riječi: {log.matched_words.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleDateString('hr-HR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nema nedavne aktivnosti
            </p>
          )}
        </CardContent>
      </Card>

      {/* Banned Words Management */}
      <ModerationClient initialBannedWords={bannedWords || []} />
    </div>
  );
}
