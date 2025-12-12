import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Extract @username mentions from text content
 */
export function extractMentions(content: string): string[] {
  // Match @username pattern (letters, numbers, underscore, hyphen)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = new Set<string>();

  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.add(match[1].toLowerCase());
  }

  return Array.from(mentions);
}

/**
 * Create mention notifications for users mentioned in content
 */
export async function createMentionNotifications(
  content: string,
  actorId: string,
  topicId: string,
  replyId?: string
) {
  const supabase = await createServerSupabaseClient();

  // Extract mentioned usernames
  const mentionedUsernames = extractMentions(content);

  if (mentionedUsernames.length === 0) {
    return { success: true, count: 0 };
  }

  // Get user IDs for mentioned usernames
  const { data: mentionedUsers } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', mentionedUsernames);

  if (!mentionedUsers || mentionedUsers.length === 0) {
    return { success: true, count: 0 };
  }

  // Don't notify the actor (user who created the mention)
  const usersToNotify = (mentionedUsers as any[]).filter(
    (user) => user.id !== actorId
  );

  if (usersToNotify.length === 0) {
    return { success: true, count: 0 };
  }

  // Create notifications
  const notifications = usersToNotify.map((user) => ({
    user_id: user.id,
    actor_id: actorId,
    type: 'mention' as const,
    topic_id: topicId,
    reply_id: replyId || null,
  }));

  const { error } = await (supabase as any)
    .from('notifications')
    .insert(notifications);

  if (error) {
    return { success: false, error, count: 0 };
  }

  return { success: true, count: usersToNotify.length };
}

/**
 * Highlight @mentions in markdown content for display
 */
export function highlightMentions(html: string): string {
  // Match @username in HTML (but not inside tags or attributes)
  const mentionRegex = /(@[a-zA-Z0-9_-]+)(?![^<]*>)/g;

  return html.replace(
    mentionRegex,
    '<span class="mention-highlight bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded font-medium">$1</span>'
  );
}
