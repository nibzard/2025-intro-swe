/**
 * Achievement System - Server-side Logic
 * Handles checking and awarding achievements (server-only)
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ACHIEVEMENTS, type AchievementId, type Achievement } from './achievements-definitions';

export type { AchievementId, Achievement };
export { ACHIEVEMENTS, getRarityColor } from './achievements-definitions';

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user stats
    const [
      { data: profile, error: profileError },
      { data: topics, error: topicsError },
      { data: replies, error: repliesError },
      { data: topicWithMostViews, error: topicViewsError },
      { data: solutionCount, error: solutionError },
      { data: activityData, error: activityError },
      { data: existingAchievements, error: achievementsError }
    ] = await Promise.all([
      supabase.from('profiles').select('reputation, created_at').eq('id', userId).single(),
      supabase.from('topics').select('id, view_count').eq('author_id', userId),
      supabase.from('replies').select('id, upvotes').eq('author_id', userId),
      supabase.from('topics').select('view_count').eq('author_id', userId).order('view_count', { ascending: false }).limit(1).single(),
      supabase.from('replies').select('id').eq('author_id', userId).eq('is_solution', true),
      supabase.from('user_activity').select('activity_date').eq('user_id', userId).order('activity_date', { ascending: false }),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId)
    ]);

    // Check for critical errors
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return [];
    }

    const earned = new Set<AchievementId>(
      (existingAchievements ?? []).map((a: { achievement_id: AchievementId }) => a.achievement_id)
    );
    const toAward: AchievementId[] = [];

  // Check topic achievements
  if (topics && topics.length >= 1 && !earned.has('first_topic')) {
    toAward.push('first_topic');
  }

  // Check reply achievements
  if (replies) {
    const replyCount = replies.length;
    const totalUpvotes = replies.reduce((sum: number, r: any) => sum + (r.upvotes || 0), 0);

    if (replyCount >= 1 && !earned.has('first_reply')) toAward.push('first_reply');
    if (replyCount >= 10 && !earned.has('10_replies')) toAward.push('10_replies');
    if (replyCount >= 50 && !earned.has('50_replies')) toAward.push('50_replies');
    if (replyCount >= 100 && !earned.has('100_replies')) toAward.push('100_replies');

    if (totalUpvotes >= 10 && !earned.has('10_upvotes')) toAward.push('10_upvotes');
    if (totalUpvotes >= 50 && !earned.has('50_upvotes')) toAward.push('50_upvotes');
  }

  // Check view achievements
  if (topicWithMostViews) {
    const views = (topicWithMostViews as any).view_count || 0;
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

  // Check helpful achievement (90%+ of replies with positive upvotes)
  if (replies && replies.length >= 10) {
    const helpfulReplies = replies.filter((r: any) => (r.upvotes || 0) > 0).length;
    const helpfulPercentage = (helpfulReplies / replies.length) * 100;
    if (helpfulPercentage >= 90 && !earned.has('helpful')) {
      toAward.push('helpful');
    }
  }

  // Check reputation achievements
  if (profile) {
    const reputation = (profile as any).reputation || 0;
    if (reputation >= 500 && !earned.has('expert')) toAward.push('expert');
    if (reputation >= 1000 && !earned.has('legend')) toAward.push('legend');

    // Early adopter (joined within first month of launch)
    // Forum launch date: December 2025
    const launchDate = new Date('2025-12-03');
    const userJoinDate = new Date((profile as any).created_at);
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

    const { error: insertError } = await supabase.from('user_achievements').insert(achievementsToInsert as any);
    
    if (insertError) {
      console.error('Achievement insert error:', insertError);
      // Return achievements that would have been awarded
      return toAward;
    }
  }

  return toAward;
  } catch (error) {
    console.error('Achievement system error:', error);
    return [];
  }
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

  return data?.map((a: any) => ({
    ...ACHIEVEMENTS[a.achievement_id as AchievementId],
    earnedAt: a.earned_at,
  })) || [];
}
