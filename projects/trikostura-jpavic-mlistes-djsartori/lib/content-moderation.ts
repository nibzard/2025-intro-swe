/**
 * Content Moderation Utilities
 * Advanced system for detecting and filtering inappropriate content
 */

import { createClient } from '@/lib/supabase/client';

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ModerationAction = 'approve' | 'censor' | 'flag' | 'block';
export type ModerationCategory = 'profanity' | 'hate_speech' | 'harassment' | 'spam' | 'other';

export interface ModerationResult {
  hasViolations: boolean;
  matchedWords: string[];
  highestSeverity: ModerationSeverity;
  recommendedAction: ModerationAction;
  censoredContent?: string;
}

export interface BannedWord {
  id: string;
  word: string;
  severity: ModerationSeverity;
  category: ModerationCategory;
  action: 'censor' | 'flag' | 'block';
  isRegex: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Check content for inappropriate words/phrases (client-side)
 */
export async function checkContent(content: string): Promise<ModerationResult> {
  const supabase = createClient();

  try {
    const { data, error } = await (supabase as any).rpc('check_content_moderation', {
      content_text: content,
    });

    if (error) {
      console.error('Content moderation check failed:', error);
      // Fail-safe: allow content if check fails
      return {
        hasViolations: false,
        matchedWords: [],
        highestSeverity: 'low',
        recommendedAction: 'approve',
      };
    }

    if (!data || data.length === 0) {
      return {
        hasViolations: false,
        matchedWords: [],
        highestSeverity: 'low',
        recommendedAction: 'approve',
      };
    }

    const result = data[0];
    return {
      hasViolations: result.has_violations,
      matchedWords: result.matched_words || [],
      highestSeverity: result.highest_severity,
      recommendedAction: result.recommended_action,
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Fail-safe: allow content if check fails
    return {
      hasViolations: false,
      matchedWords: [],
      highestSeverity: 'low',
      recommendedAction: 'approve',
    };
  }
}

/**
 * Censor inappropriate content by replacing banned words with asterisks
 */
export async function censorContent(content: string): Promise<string> {
  const supabase = createClient();

  try {
    const { data, error } = await (supabase as any).rpc('censor_content', {
      content_text: content,
    });

    if (error) {
      console.error('Content censoring failed:', error);
      return content;
    }

    return data || content;
  } catch (error) {
    console.error('Content censoring error:', error);
    return content;
  }
}

/**
 * Log a moderation action
 */
export async function logModerationAction(params: {
  contentType: 'topic' | 'reply' | 'message';
  contentId: string;
  userId: string;
  action: 'auto_flag' | 'manual_flag' | 'approve' | 'block' | 'censor';
  matchedWords: string[];
  severity: ModerationSeverity;
  reason?: string;
  moderatorId?: string;
}): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await (supabase as any).from('moderation_logs').insert({
      content_type: params.contentType,
      content_id: params.contentId,
      user_id: params.userId,
      action: params.action,
      matched_words: params.matchedWords,
      severity: params.severity,
      reason: params.reason,
      moderator_id: params.moderatorId,
    });

    if (error) {
      console.error('Failed to log moderation action:', error);
    }
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}

/**
 * Get all active banned words (for admin interface)
 */
export async function getBannedWords(): Promise<BannedWord[]> {
  const supabase = createClient();

  try {
    const { data, error } = await (supabase as any)
      .from('banned_words')
      .select('*')
      .order('severity', { ascending: false })
      .order('word', { ascending: true });

    if (error) {
      console.error('Failed to fetch banned words:', error);
      return [];
    }

    return (data || []).map((word: any) => ({
      id: word.id,
      word: word.word,
      severity: word.severity,
      category: word.category,
      action: word.action,
      isRegex: word.is_regex,
      isActive: word.is_active,
      createdAt: word.created_at,
    }));
  } catch (error) {
    console.error('Error fetching banned words:', error);
    return [];
  }
}

/**
 * Add a new banned word (admin only)
 */
export async function addBannedWord(params: {
  word: string;
  severity: ModerationSeverity;
  category: ModerationCategory;
  action: 'censor' | 'flag' | 'block';
  isRegex?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await (supabase as any).from('banned_words').insert({
      word: params.word,
      severity: params.severity,
      category: params.category,
      action: params.action,
      is_regex: params.isRegex || false,
      created_by: user.id,
    });

    if (error) {
      console.error('Failed to add banned word:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error adding banned word:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a banned word (admin only)
 */
export async function updateBannedWord(
  id: string,
  params: Partial<{
    word: string;
    severity: ModerationSeverity;
    category: ModerationCategory;
    action: 'censor' | 'flag' | 'block';
    isRegex: boolean;
    isActive: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const updateData: any = {};
    if (params.word !== undefined) updateData.word = params.word;
    if (params.severity !== undefined) updateData.severity = params.severity;
    if (params.category !== undefined) updateData.category = params.category;
    if (params.action !== undefined) updateData.action = params.action;
    if (params.isRegex !== undefined) updateData.is_regex = params.isRegex;
    if (params.isActive !== undefined) updateData.is_active = params.isActive;

    const { error } = await (supabase as any)
      .from('banned_words')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update banned word:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating banned word:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a banned word (admin only)
 */
export async function deleteBannedWord(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await (supabase as any).from('banned_words').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete banned word:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting banned word:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate and moderate content before submission
 * Returns modified content or throws error if blocked
 */
export async function moderateContent(params: {
  content: string;
  title?: string;
  userId: string;
  contentType: 'topic' | 'reply' | 'message';
  contentId?: string;
}): Promise<{
  approved: boolean;
  content: string;
  title?: string;
  reason?: string;
  severity?: ModerationSeverity;
}> {
  // Check content
  const contentCheck = await checkContent(params.content);
  const titleCheck = params.title ? await checkContent(params.title) : null;

  // Determine highest severity
  const highestSeverity =
    titleCheck && titleCheck.highestSeverity === 'critical'
      ? 'critical'
      : contentCheck.highestSeverity;

  const allMatchedWords = [
    ...contentCheck.matchedWords,
    ...(titleCheck?.matchedWords || []),
  ];

  // Determine final action
  let finalAction: ModerationAction = 'approve';
  if (titleCheck?.recommendedAction === 'block' || contentCheck.recommendedAction === 'block') {
    finalAction = 'block';
  } else if (
    titleCheck?.recommendedAction === 'flag' ||
    contentCheck.recommendedAction === 'flag'
  ) {
    finalAction = 'flag';
  } else if (
    titleCheck?.recommendedAction === 'censor' ||
    contentCheck.recommendedAction === 'censor'
  ) {
    finalAction = 'censor';
  }

  // Log moderation action if violations found
  if (contentCheck.hasViolations || titleCheck?.hasViolations) {
    await logModerationAction({
      contentType: params.contentType,
      contentId: params.contentId || 'new',
      userId: params.userId,
      action: finalAction === 'block' ? 'block' : finalAction === 'flag' ? 'auto_flag' : 'censor',
      matchedWords: allMatchedWords,
      severity: highestSeverity,
      reason: `Matched words: ${allMatchedWords.join(', ')}`,
    });
  }

  // Handle different actions
  if (finalAction === 'block') {
    return {
      approved: false,
      content: params.content,
      title: params.title,
      reason: `Vaš sadržaj sadrži neprimjeren jezik i ne može biti objavljen. Molimo uklonite: ${allMatchedWords.join(', ')}`,
      severity: highestSeverity,
    };
  }

  if (finalAction === 'censor') {
    const censoredContent = await censorContent(params.content);
    const censoredTitle = params.title ? await censorContent(params.title) : undefined;

    return {
      approved: true,
      content: censoredContent,
      title: censoredTitle,
      severity: highestSeverity,
    };
  }

  // Approve with flag for manual review if needed
  return {
    approved: true,
    content: params.content,
    title: params.title,
    severity: finalAction === 'flag' ? highestSeverity : undefined,
  };
}

/**
 * Get moderation statistics for admin dashboard
 */
export async function getModerationStats(): Promise<{
  totalFlags: number;
  pendingReview: number;
  blockedToday: number;
  topViolations: { word: string; count: number }[];
}> {
  const supabase = createClient();

  try {
    // Get total flagged content
    const { count: totalFlags } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'auto_flag');

    // Get pending reviews
    const { count: pendingTopics } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'flagged');

    const { count: pendingReplies } = await supabase
      .from('replies')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'flagged');

    // Get blocked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: blockedToday } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'block')
      .gte('created_at', today.toISOString());

    // Get top violations (this is simplified, would need more complex query)
    const { data: logs } = await supabase
      .from('moderation_logs')
      .select('matched_words')
      .limit(100);

    const wordCounts: Record<string, number> = {};
    logs?.forEach((log: any) => {
      log.matched_words?.forEach((word: string) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    const topViolations = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      totalFlags: totalFlags || 0,
      pendingReview: (pendingTopics || 0) + (pendingReplies || 0),
      blockedToday: blockedToday || 0,
      topViolations,
    };
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return {
      totalFlags: 0,
      pendingReview: 0,
      blockedToday: 0,
      topViolations: [],
    };
  }
}
