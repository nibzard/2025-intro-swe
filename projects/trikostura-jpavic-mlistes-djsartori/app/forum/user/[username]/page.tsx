import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Award, Users, Calendar, MapPin, Globe, Github, Linkedin, Twitter, Star, TrendingUp, BookMarked, Settings } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  // Get user's topics
  const { data: topics } = await supabase
    .from('topics')
    .select(\`
      *,
      category:categories(name, slug, color, icon)
    \`)
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user's replies
  const { data: replies } = await supabase
    .from('replies')
    .select(\`
      *,
      topic:topics(id, title, slug)
    \`)
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(\`
      *,
      badge:badges(*)
    \`)
    .eq('user_id', profile.id)
    .order('earned_at', { ascending: false });

  // Get follower/following counts
  const { count: followersCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const { count: followingCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // Check if current user follows this profile
  let isFollowing = false;
  if (currentUser && currentUser.id !== profile.id) {
    const { data: followData } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single();
    isFollowing = !!followData;
  }

  // Get saved topics if own profile
  let savedTopics = null;
  if (isOwnProfile) {
    const { data } = await supabase
      .from('saved_topics')
      .select(\`
        topic:topics(
          *,
          category:categories(name, slug, color, icon),
          author:profiles(username)
        )
      \`)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    savedTopics = data;
  }

  const socialLinks = profile.social_links as any || {};

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="relative flex items-start gap-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-3xl object-cover" />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>
            {profile.streak_days > 0 && (
              <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold text-sm shadow-lg">
                🔥 {profile.streak_days} days
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {profile.username}
                </h1>
                {profile.bio && (
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  <Link href="/forum/settings/profile">
                    <Button className="font-semibold">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : currentUser ? (
                  <>
                    <Button className="font-semibold">
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                    <Link href={`/forum/messages/new?to=${profile.username}`}>
                      <Button variant="outline" className="font-semibold">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>

            {/* Social Links */}
            {(socialLinks.github || socialLinks.linkedin || socialLinks.twitter) && (
              <div className="flex items-center gap-3 mb-4">
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                    <Twitter className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {profile.reputation}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Reputation</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{topics?.length || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Topics</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{replies?.length || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Replies</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{followersCount || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Followers</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{followingCount || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {userBadges && userBadges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Badges</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userBadges.map((ub: any) => (
              <div key={ub.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 text-center">
                <div className="text-4xl mb-2">{ub.badge.icon}</div>
                <div className="font-bold text-gray-900 dark:text-white mb-1">{ub.badge.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{ub.badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs for activity */}
      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-2">
          <TabsTrigger value="topics" className="rounded-xl">Topics</TabsTrigger>
          <TabsTrigger value="replies" className="rounded-xl">Replies</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="saved" className="rounded-xl">Saved</TabsTrigger>}
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          {topics && topics.length > 0 ? (
            topics.map((topic: any) => (
              <div key={topic.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: topic.category?.color + '20', color: topic.category?.color }}>
                    {topic.category?.icon} {topic.category?.name}
                  </span>
                </div>
                <Link href={`/forum/topic/${topic.slug}`} className="text-xl font-bold hover:text-blue-600 transition-colors">
                  {topic.title}
                </Link>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{topic.reply_count} replies</span>
                  <span>{topic.view_count} views</span>
                  <span>{formatDistanceToNow(new Date(topic.created_at))} ago</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">No topics yet</div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          {replies && replies.length > 0 ? (
            replies.map((reply: any) => (
              <div key={reply.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <Link href={`/forum/topic/${reply.topic.slug}#reply-${reply.id}`} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline mb-2 block">
                  Re: {reply.topic.title}
                </Link>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3">{reply.content}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{reply.upvotes - reply.downvotes} votes</span>
                  <span>{formatDistanceToNow(new Date(reply.created_at))} ago</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">No replies yet</div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved" className="space-y-4">
            {savedTopics && savedTopics.length > 0 ? (
              savedTopics.map((st: any) => (
                <div key={st.topic.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: st.topic.category?.color + '20', color: st.topic.category?.color }}>
                      {st.topic.category?.icon} {st.topic.category?.name}
                    </span>
                  </div>
                  <Link href={`/forum/topic/${st.topic.slug}`} className="text-xl font-bold hover:text-blue-600 transition-colors">
                    {st.topic.title}
                  </Link>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>by {st.topic.author.username}</span>
                    <span>{st.topic.reply_count} replies</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">No saved topics</div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
