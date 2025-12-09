'use server';

import { createMentionNotifications } from '@/lib/mentions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function processMentions(
  content: string,
  actorId: string,
  topicId: string,
  replyId?: string
) {
  return createMentionNotifications(content, actorId, topicId, replyId);
}

export async function deleteTopicAction(topicId: string) {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get user profile to check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get topic to check ownership
  const { data: topic } = await supabase
    .from('topics')
    .select('author_id, slug, category_id')
    .eq('id', topicId)
    .single();

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  // Check if user is author or admin
  const isAuthor = topic.author_id === user.id;
  const isAdmin = profile?.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to delete (bypass RLS)
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Revalidate relevant paths
  revalidatePath('/forum');
  revalidatePath(`/forum/topic/${topic.slug}`);
  revalidatePath(`/forum/category/*`);

  return { success: true };
}
