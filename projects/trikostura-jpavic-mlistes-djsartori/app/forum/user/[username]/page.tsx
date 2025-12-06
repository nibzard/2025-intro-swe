import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Calendar, MessageSquare, User as UserIcon, Github, Linkedin, Globe, Twitter, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

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

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user?.id === profile.id;

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

  const profileColor = profile.profile_color || '#3B82F6';
  const skills = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4">
      {/* Profile Banner */}
      {profile.profile_banner_url ? (
        <div className="relative w-full h-40 sm:h-64 rounded-lg overflow-hidden">
          <Image
            src={profile.profile_banner_url}
            alt="Profile Banner"
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full h-40 sm:h-64 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${profileColor} 0%, ${profileColor}dd 100%)`,
          }}
        />
      )}

      {/* Profile Header */}
      <Card className="relative -mt-12 sm:-mt-16">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative mx-auto sm:mx-0">
              <Avatar
                src={profile.avatar_url}
                alt={profile.username}
                username={profile.username}
                size="2xl"
                className="border-4 border-white dark:border-gray-800"
              />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{profile.username}</h1>
                  {profile.full_name && (
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-3">
                      {profile.full_name}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <Link href={`/forum/user/${username}/edit`} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto whitespace-nowrap">
                      <Edit className="w-4 h-4 mr-2" />
                      Uredi Profil
                    </Button>
                  </Link>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 text-center sm:text-left">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
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

              {/* Social Links */}
              {(profile.github_url || profile.linkedin_url || profile.website_url || profile.twitter_url) && (
                <div className="flex justify-center sm:justify-start gap-3 mb-4">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Website"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Twitter/X"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Academic Info */}
          {(profile.university || profile.study_program || profile.year_of_study || profile.graduation_year) && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Akademske Informacije</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                {profile.university && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Sveučilište</span>
                    <p className="font-medium text-gray-900 dark:text-white">{profile.university}</p>
                  </div>
                )}
                {profile.study_program && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Program</span>
                    <p className="font-medium text-gray-900 dark:text-white">{profile.study_program}</p>
                  </div>
                )}
                {profile.year_of_study && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Godina</span>
                    <p className="font-medium text-gray-900 dark:text-white">{profile.year_of_study}. godina</p>
                  </div>
                )}
                {profile.graduation_year && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Završetak</span>
                    <p className="font-medium text-gray-900 dark:text-white">{profile.graduation_year}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Interests */}
          {profile.academic_interests && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Akademski Interesi</h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{profile.academic_interests}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Vještine i Tehnologije</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${profileColor}20`,
                      color: profileColor,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {topicCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Teme</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {replyCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Odgovori</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {profile.reputation || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reputacija</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
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
                {topics.map((topic: any) => (
                  <div key={topic.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="font-semibold hover:text-blue-600 transition-colors block mb-1"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
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
                {replies.map((reply: any) => (
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
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(reply.created_at).toLocaleDateString('hr-HR')}</span>
                      <span className="flex items-center gap-1">
                        👍 {reply.upvotes || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                <p>Još nema odgovora</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
