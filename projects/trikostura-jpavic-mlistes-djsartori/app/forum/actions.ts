'use server';

import { createMentionNotifications } from '@/lib/mentions';

export async function processMentions(
  content: string,
  actorId: string,
  topicId: string,
  replyId?: string
) {
  return createMentionNotifications(content, actorId, topicId, replyId);
}
