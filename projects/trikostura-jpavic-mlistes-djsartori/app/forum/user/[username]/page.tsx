import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Calendar, MessageSquare, User as UserIcon, Github, Linkedin, Globe, Twitter, Edit, TrendingUp, Award, Star, Sparkles, Trophy, Target, Zap, BookOpen, CheckCircle, Mail, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SendMessageButton } from '@/components/messages/send-message-button';
import { FollowButton } from '@/components/user/follow-button';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import { getFollowStatus } from '../actions';
import { getUserAchievements, checkAndAwardAchievements } from '@/lib/achievements';
import { BadgeShowcaseComponent } from '@/components/gamification/badge-showcase';
import { ActivityCalendar } from '@/components/gamification/activity-calendar';
import { StatsDashboard } from '@/components/gamification/stats-dashboard';

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

// Disable caching for profile pages to always show latest data
export const revalidate = 0;

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

  // Check and award new achievements
  await checkAndAwardAchievements(profile.id);

  // Run all profile data queries in parallel
  const [
    followStatus,
    { data: topicsData },
    { data: repliesData },
    achievements,
    { data: activityData },
    { data: allTopicsData },
    { data: allRepliesData },
    { data: categoriesForStats }
  ] = await Promise.all([
    !isOwnProfile && user
      ? getFollowStatus(profile.id)
      : Promise.resolve({ isFollowing: false }),
    supabase
      .from('topics')
      .select('*')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('replies')
      .select('*')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    getUserAchievements(profile.id),
    supabase
      .from('user_activity')
      .select('activity_date, topics_count, replies_count')
      .eq('user_id', profile.id)
      .order('activity_date', { ascending: false }),
    supabase
      .from('topics')
      .select('id, view_count, category_id')
      .eq('author_id', profile.id),
    supabase
      .from('replies')
      .select('id, upvotes, is_solution')
      .eq('author_id', profile.id),
    supabase
      .from('categories')
      .select('id, name, color')
  ]);

  const { isFollowing } = followStatus;

  // Get categories for topics and topics for replies in parallel
  const categoryIds = topicsData ? [...new Set(topicsData.map((t: any) => t.category_id))] : [];
  const topicIds = repliesData ? [...new Set(repliesData.map((r: any) => r.topic_id))] : [];

  const [
    { data: categoriesData },
    { data: topicsForReplies }
  ] = await Promise.all([
    categoryIds.length > 0
      ? supabase
          .from('categories')
          .select('id, name, slug, color')
          .in('id', categoryIds)
      : Promise.resolve({ data: [] }),
    topicIds.length > 0
      ? supabase
          .from('topics')
          .select('id, title, slug')
          .in('id', topicIds)
      : Promise.resolve({ data: [] })
  ]);

  // Enrich topics with categories
  const categoriesMap = new Map(categoriesData?.map((c: any) => [c.id, c]));
  const topics = topicsData?.map((topic: any) => ({
    ...topic,
    category: categoriesMap.get(topic.category_id) || null,
  })) || [];

  // Enrich replies with topic data
  const topicsMap = new Map(topicsForReplies?.map((t: any) => [t.id, t]));
  const replies = repliesData?.map((reply: any) => ({
    ...reply,
    topic: topicsMap.get(reply.topic_id) || null,
  })) || [];

  // Calculate statistics
  const topicCount = topics?.length || 0;
  const replyCount = replies?.length || 0;

  const profileColor = profile.profile_color || '#3B82F6';
  const skills = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  // Process activity data for calendar
  const activity = activityData?.map((a: any) => ({
    date: a.activity_date,
    count: a.topics_count + a.replies_count,
  })) || [];

  // Calculate streaks
  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const sortedDates = dates.sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (sortedDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateLongestStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const sortedDates = [...new Set(dates)].sort();
    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  const activityDates = activityData?.map((a: any) => a.activity_date) || [];
  const currentStreak = calculateStreak(activityDates);
  const longestStreak = calculateLongestStreak(activityDates);

  // Calculate stats for dashboard
  const totalTopics = allTopicsData?.length || 0;
  const totalReplies = allRepliesData?.length || 0;
  const totalViews = allTopicsData?.reduce((sum: number, t: any) => sum + (t.view_count || 0), 0) || 0;
  const totalUpvotes = allRepliesData?.reduce((sum: number, r: any) => sum + (r.upvotes || 0), 0) || 0;
  const solutionsMarked = allRepliesData?.filter((r: any) => r.is_solution).length || 0;

  // Topics by category
  const categoriesMapForStats = new Map(categoriesForStats?.map((c: any) => [c.id, c]));
  const topicsByCategoryMap = new Map<string, number>();
  allTopicsData?.forEach((topic: any) => {
    const count = topicsByCategoryMap.get(topic.category_id) || 0;
    topicsByCategoryMap.set(topic.category_id, count + 1);
  });

  const topicsByCategory = Array.from(topicsByCategoryMap.entries()).map(([categoryId, count]) => {
    const category = categoriesMapForStats.get(categoryId);
    return {
      category: category?.name || 'Nepoznato',
      count,
      color: category?.color || '#3B82F6',
    };
  }).sort((a, b) => b.count - a.count);

  const stats = {
    totalViews,
    totalUpvotes,
    solutionsMarked,
    topicsByCategory,
  };

  // Calculate user level based on reputation
  const reputation = profile.reputation || 0;
  const level = Math.floor(reputation / 100) + 1;
  const nextLevelRep = level * 100;
  const progressToNextLevel = ((reputation % 100) / 100) * 100;

  // Determine rank badge
  const getRankBadge = () => {
    if (reputation >= 1000) return { name: 'Legenda', icon: Trophy, color: 'from-yellow-400 to-orange-500' };
    if (reputation >= 500) return { name: 'Ekspert', icon: Star, color: 'from-purple-400 to-pink-500' };
    if (reputation >= 250) return { name: 'Stručnjak', icon: Award, color: 'from-blue-400 to-cyan-500' };
    if (reputation >= 100) return { name: 'Aktivan', icon: Zap, color: 'from-green-400 to-emerald-500' };
    return { name: 'Početnik', icon: Target, color: 'from-gray-400 to-gray-500' };
  };

  const rankBadge = getRankBadge();

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 pb-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Forum', href: '/forum' },
          { label: 'Korisnici', href: '/forum/users' },
          { label: profile.username },
        ]}
      />

      {/* Profile Banner with Overlay */}
      <div className="relative w-full h-48 sm:h-72 rounded-2xl overflow-hidden shadow-2xl">
        {profile.profile_banner_url ? (
          <>
            <Image
              src={profile.profile_banner_url}
              alt="Profile Banner"
              fill
              className="object-cover"
              priority
              quality={85}
              sizes="(max-width: 1536px) 100vw, 1536px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div
            className="w-full h-full relative"
            style={{
              background: `linear-gradient(135deg, ${profileColor} 0%, ${profileColor}dd 50%, ${profileColor}aa 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        )}

        {/* Rank Badge Overlay */}
        <div className="absolute top-4 right-4">
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${rankBadge.color} text-white font-bold text-sm shadow-lg backdrop-blur-sm flex items-center gap-2`}>
            <rankBadge.icon className="w-4 h-4" />
            {rankBadge.name}
          </div>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="relative -mt-20 sm:-mt-24 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-2 border-gray-100 dark:border-gray-800 shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with Level Ring */}
            <div className="relative mx-auto sm:mx-0 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative">
                <Avatar
                  src={profile.avatar_url}
                  alt={profile.username}
                  username={profile.username}
                  size="2xl"
                  className="border-4 border-white dark:border-gray-900 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-600 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white dark:border-gray-900">
                  {level}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-w-0">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent break-words">
                      {profile.username}
                    </h1>
                    {profile.role === 'admin' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        ADMIN
                      </span>
                    )}
                    {profile.role === 'moderator' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        MODERATOR
                      </span>
                    )}
                    {profile.email_verified && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1" title="Verificirani email">
                        <CheckCircle className="w-3 h-3" />
                        VERIFICIRAN
                      </span>
                    )}
                  </div>
                  {profile.full_name && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3 break-words">
                      {profile.full_name}
                    </p>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Član od {new Date(profile.created_at).toLocaleDateString('hr-HR')}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {isOwnProfile ? (
                    <Link href={`/forum/user/${username}/edit`} className="w-full sm:w-auto">
                      <Button variant="gradient" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                        <Edit className="w-4 h-4 mr-2" />
                        Uredi Profil
                      </Button>
                    </Link>
                  ) : user && (
                    <>
                      <FollowButton
                        targetUserId={profile.id}
                        initialIsFollowing={isFollowing}
                      />
                      <SendMessageButton
                        targetUserId={profile.id}
                        targetUsername={profile.username}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-base text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Level Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nivo {level}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {reputation} / {nextLevelRep} RP
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
              </div>

              {/* Social Links */}
              {(profile.github_url || profile.linkedin_url || profile.website_url || profile.twitter_url) && (
                <div className="flex justify-center sm:justify-start gap-3">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
                      className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
                      className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
                      className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Akademske Informacije</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {profile.university && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Sveučilište</span>
                    <p className="font-bold text-gray-900 dark:text-white mt-1">{profile.university}</p>
                  </div>
                )}
                {profile.study_program && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Program</span>
                    <p className="font-bold text-gray-900 dark:text-white mt-1">{profile.study_program}</p>
                  </div>
                )}
                {profile.year_of_study && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Godina</span>
                    <p className="font-bold text-gray-900 dark:text-white mt-1">{profile.year_of_study}. godina</p>
                  </div>
                )}
                {profile.graduation_year && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800">
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Završetak</span>
                    <p className="font-bold text-gray-900 dark:text-white mt-1">{profile.graduation_year}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Interests */}
          {profile.academic_interests && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Akademski Interesi</h3>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-base text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap leading-relaxed">{profile.academic_interests}</p>
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vještine i Tehnologije</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-default border-2"
                    style={{
                      backgroundColor: `${profileColor}15`,
                      borderColor: `${profileColor}40`,
                      color: profileColor,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  {topicCount}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Teme</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <UserIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                  {replyCount}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Odgovori</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {profile.reputation || 0}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Reputacija</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {topicCount + replyCount}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Aktivnosti</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {profile.follower_count || 0}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Pratitelja</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transition-all">
                <Users className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 bg-clip-text text-transparent mb-1">
                  {profile.following_count || 0}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Prati</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification Components */}
      <div className="space-y-6">
        {/* Activity Calendar */}
        <ActivityCalendar
          activity={activity}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />

        {/* Stats Dashboard */}
        <StatsDashboard stats={stats} />

        {/* Badge Showcase */}
        <BadgeShowcaseComponent achievements={achievements} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Topics */}
        <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">Najnovije teme</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topics && topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((topic: any) => (
                  <div key={topic.id} className="group p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block mb-2 leading-tight"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <span
                        className="px-3 py-1 text-xs font-bold rounded-lg shadow-sm"
                        style={{
                          backgroundColor: topic.category?.color + '20',
                          color: topic.category?.color,
                        }}
                      >
                        {topic.category?.name}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {topic.reply_count}
                      </span>
                      <span className="text-xs">{new Date(topic.created_at).toLocaleDateString('hr-HR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Još nema tema</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Replies */}
        <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <UserIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">Najnoviji odgovori</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {replies && replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply: any) => (
                  <div key={reply.id} className="group p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <Link
                      href={`/forum/topic/${reply.topic.slug}`}
                      className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block mb-2"
                    >
                      Odgovor u: <span className="font-bold text-gray-900 dark:text-white">{reply.topic.title}</span>
                    </Link>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                      {reply.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{new Date(reply.created_at).toLocaleDateString('hr-HR')}</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold">
                        👍 {reply.upvotes || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Još nema odgovora</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
