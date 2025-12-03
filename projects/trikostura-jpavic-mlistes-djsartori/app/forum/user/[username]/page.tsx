import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calendar, User as UserIcon } from 'lucide-react';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `${username} - Profil | Studentski Forum`,
    description: `Profil korisnika ${username} na Studentskom Forumu`,
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Get user's topics
  const { data: topics } = await (supabase as any)
    .from('topics')
    .select(`
      *,
      category:categories(name, slug, color)
    `)
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user's recent replies
  const { data: replies } = await (supabase as any)
    .from('replies')
    .select(`
      *,
      topic:topics(title, slug)
    `)
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate statistics
  const topicCount = topics?.length || 0;
  const replyCount = replies?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
              {profile.full_name && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                  {profile.full_name}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Pridružio se {new Date(profile.created_at).toLocaleDateString('hr-HR')}
                  </span>
                </div>
                {profile.role === 'admin' && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-semibold">
                    ADMIN
                  </span>
                )}
                {profile.role === 'moderator' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-semibold">
                    MODERATOR
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{topicCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Teme</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{replyCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Odgovori</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {profile.reputation || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reputacija</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {topicCount + replyCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ukupno aktivnosti</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Najnovije teme
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topics && topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div key={topic.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="font-semibold hover:text-blue-600 transition-colors block mb-1"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded"
                        style={{
                          backgroundColor: topic.category?.color + '20',
                          color: topic.category?.color,
                        }}
                      >
                        {topic.category?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {topic.reply_count}
                      </span>
                      <span>{new Date(topic.created_at).toLocaleDateString('hr-HR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Još nema tema</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Replies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Najnoviji odgovori
            </CardTitle>
          </CardHeader>
          <CardContent>
            {replies && replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <Link
                      href={`/forum/topic/${reply.topic.slug}`}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors block mb-1"
                    >
                      Odgovor u: <span className="font-semibold">{reply.topic.title}</span>
                    </Link>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                      {reply.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(reply.created_at).toLocaleDateString('hr-HR')}</span>
                      <span className="flex items-center gap-1">
                        👍 {reply.upvotes || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Još nema odgovora</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
