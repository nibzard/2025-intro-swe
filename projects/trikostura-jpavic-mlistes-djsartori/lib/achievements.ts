/**
 * Achievement System
 * Defines all available achievements and tracking logic
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Trophy,
  MessageSquare,
  Eye,
  ThumbsUp,
  Flame,
  Star,
  Target,
  Award,
  BookOpen,
  Users,
  Zap,
  TrendingUp,
  Heart,
  Crown,
  Sparkles
} from 'lucide-react';

export type AchievementId =
  | 'first_topic'
  | 'first_reply'
  | 'topic_100_views'
  | 'topic_500_views'
  | '10_replies'
  | '50_replies'
  | '100_replies'
  | '10_upvotes'
  | '50_upvotes'
  | '7_day_streak'
  | '30_day_streak'
  | '10_solutions'
  | 'early_adopter'
  | 'helpful'
  | 'popular'
  | 'expert'
  | 'legend';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: any; // Lucide icon component
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  requirement: number;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  // Beginner achievements
  first_topic: {
    id: 'first_topic',
    name: 'Prvi korak',
    description: 'Objavio prvu temu',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-blue-400 to-blue-600',
    requirement: 1,
  },
  first_reply: {
    id: 'first_reply',
    name: 'Prvi odgovor',
    description: 'Objavio prvi odgovor',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-green-400 to-green-600',
    requirement: 1,
  },

  // View achievements
  topic_100_views: {
    id: 'topic_100_views',
    name: 'Popularan',
    description: 'Tema dosegla 100 pregleda',
    icon: Eye,
    rarity: 'rare',
    color: 'from-purple-400 to-purple-600',
    requirement: 100,
  },
  topic_500_views: {
    id: 'topic_500_views',
    name: 'Viral',
    description: 'Tema dosegla 500 pregleda',
    icon: TrendingUp,
    rarity: 'epic',
    color: 'from-pink-400 to-pink-600',
    requirement: 500,
  },

  // Reply achievements
  '10_replies': {
    id: '10_replies',
    name: 'Razgovorljiv',
    description: 'Objavio 10 odgovora',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-cyan-400 to-cyan-600',
    requirement: 10,
  },
  '50_replies': {
    id: '50_replies',
    name: 'Aktivan sugovornik',
    description: 'Objavio 50 odgovora',
    icon: Zap,
    rarity: 'rare',
    color: 'from-orange-400 to-orange-600',
    requirement: 50,
  },
  '100_replies': {
    id: '100_replies',
    name: 'Guru odgovora',
    description: 'Objavio 100 odgovora',
    icon: Crown,
    rarity: 'epic',
    color: 'from-yellow-400 to-yellow-600',
    requirement: 100,
  },

  // Upvote achievements
  '10_upvotes': {
    id: '10_upvotes',
    name: 'Cijenjen',
    description: 'Dobio 10 upvote-ova',
    icon: ThumbsUp,
    rarity: 'common',
    color: 'from-emerald-400 to-emerald-600',
    requirement: 10,
  },
  '50_upvotes': {
    id: '50_upvotes',
    name: 'Vrlo cijenjen',
    description: 'Dobio 50 upvote-ova',
    icon: Heart,
    rarity: 'rare',
    color: 'from-red-400 to-red-600',
    requirement: 50,
  },

  // Streak achievements
  '7_day_streak': {
    id: '7_day_streak',
    name: 'Posvećen',
    description: '7 dana uzastopnog aktivnosti',
    icon: Flame,
    rarity: 'rare',
    color: 'from-orange-500 to-red-500',
    requirement: 7,
  },
  '30_day_streak': {
    id: '30_day_streak',
    name: 'Nepokolebljiv',
    description: '30 dana uzastopnog aktivnosti',
    icon: Flame,
    rarity: 'legendary',
    color: 'from-red-500 to-yellow-500',
    requirement: 30,
  },

  // Solution achievements
  '10_solutions': {
    id: '10_solutions',
    name: 'Rješavač problema',
    description: '10 označenih rješenja',
    icon: Target,
    rarity: 'epic',
    color: 'from-indigo-400 to-indigo-600',
    requirement: 10,
  },

  // Special achievements
  early_adopter: {
    id: 'early_adopter',
    name: 'Rani korisnik',
    description: 'Među prvim članovima zajednice',
    icon: Star,
    rarity: 'legendary',
    color: 'from-purple-500 to-pink-500',
    requirement: 1,
  },
  helpful: {
    id: 'helpful',
    name: 'Pomoćna ruka',
    description: '90%+ korisnih odgovora',
    icon: Users,
    rarity: 'epic',
    color: 'from-teal-400 to-teal-600',
    requirement: 90,
  },
  popular: {
    id: 'popular',
    name: 'Zvijezda zajednice',
    description: '1000+ ukupnih pregleda',
    icon: Sparkles,
    rarity: 'epic',
    color: 'from-violet-400 to-violet-600',
    requirement: 1000,
  },
  expert: {
    id: 'expert',
    name: 'Stručnjak',
    description: '500+ reputacije',
    icon: Award,
    rarity: 'epic',
    color: 'from-blue-500 to-purple-500',
    requirement: 500,
  },
  legend: {
    id: 'legend',
    name: 'Legenda',
    description: '1000+ reputacije',
    icon: Trophy,
    rarity: 'legendary',
    color: 'from-yellow-500 to-orange-500',
    requirement: 1000,
  },
};

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get user stats
  const [
    { data: profile },
    { data: topics },
    { data: replies },
    { data: topicWithMostViews },
    { data: solutionCount },
    { data: activityData },
    { data: existingAchievements }
  ] = await Promise.all([
    supabase.from('profiles').select('reputation, created_at').eq('id', userId).single(),
    supabase.from('topics').select('id, view_count').eq('author_id', userId),
    supabase.from('replies').select('id, upvotes').eq('author_id', userId),
    supabase.from('topics').select('view_count').eq('author_id', userId).order('view_count', { ascending: false }).limit(1).single(),
    supabase.from('replies').select('id').eq('author_id', userId).eq('is_solution', true),
    supabase.from('user_activity').select('activity_date').eq('user_id', userId).order('activity_date', { ascending: false }),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId)
  ]);

  const earned = new Set(existingAchievements?.map(a => a.achievement_id) || []);
  const toAward: AchievementId[] = [];

  // Check topic achievements
  if (topics && topics.length >= 1 && !earned.has('first_topic')) {
    toAward.push('first_topic');
  }

  // Check reply achievements
  if (replies) {
    const replyCount = replies.length;
    const totalUpvotes = replies.reduce((sum, r: any) => sum + (r.upvotes || 0), 0);

    if (replyCount >= 1 && !earned.has('first_reply')) toAward.push('first_reply');
    if (replyCount >= 10 && !earned.has('10_replies')) toAward.push('10_replies');
    if (replyCount >= 50 && !earned.has('50_replies')) toAward.push('50_replies');
    if (replyCount >= 100 && !earned.has('100_replies')) toAward.push('100_replies');

    if (totalUpvotes >= 10 && !earned.has('10_upvotes')) toAward.push('10_upvotes');
    if (totalUpvotes >= 50 && !earned.has('50_upvotes')) toAward.push('50_upvotes');
  }

  // Check view achievements
  if (topicWithMostViews) {
    const views = topicWithMostViews.view_count || 0;
    if (views >= 100 && !earned.has('topic_100_views')) toAward.push('topic_100_views');
    if (views >= 500 && !earned.has('topic_500_views')) toAward.push('topic_500_views');
  }

  // Check total views
  if (topics) {
    const totalViews = topics.reduce((sum: number, t: any) => sum + (t.view_count || 0), 0);
    if (totalViews >= 1000 && !earned.has('popular')) toAward.push('popular');
  }

  // Check solution achievements
  if (solutionCount && solutionCount.length >= 10 && !earned.has('10_solutions')) {
    toAward.push('10_solutions');
  }

  // Check reputation achievements
  if (profile) {
    const reputation = profile.reputation || 0;
    if (reputation >= 500 && !earned.has('expert')) toAward.push('expert');
    if (reputation >= 1000 && !earned.has('legend')) toAward.push('legend');

    // Early adopter (joined within first month of launch)
    // Adjust this date to your forum's launch date
    const launchDate = new Date('2024-01-01');
    const userJoinDate = new Date(profile.created_at);
    const monthAfterLaunch = new Date(launchDate);
    monthAfterLaunch.setMonth(monthAfterLaunch.getMonth() + 1);

    if (userJoinDate <= monthAfterLaunch && !earned.has('early_adopter')) {
      toAward.push('early_adopter');
    }
  }

  // Check streak achievements
  if (activityData && activityData.length > 0) {
    const streak = calculateStreak(activityData.map((a: any) => a.activity_date));
    if (streak >= 7 && !earned.has('7_day_streak')) toAward.push('7_day_streak');
    if (streak >= 30 && !earned.has('30_day_streak')) toAward.push('30_day_streak');
  }

  // Award new achievements
  if (toAward.length > 0) {
    const achievementsToInsert = toAward.map(id => ({
      user_id: userId,
      achievement_id: id,
    }));

    await supabase.from('user_achievements').insert(achievementsToInsert);
  }

  return toAward;
}

/**
 * Calculate current streak from activity dates
 */
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const activityDate = new Date(sortedDates[i]);
    activityDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (activityDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  return data?.map(a => ({
    ...ACHIEVEMENTS[a.achievement_id as AchievementId],
    earnedAt: a.earned_at,
  })) || [];
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 dark:text-gray-400';
    case 'rare': return 'text-blue-600 dark:text-blue-400';
    case 'epic': return 'text-purple-600 dark:text-purple-400';
    case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
  }
}
