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
  const isAuthor = (topic as any).author_id === user.id;
  const isAdmin = (profile as any)?.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to delete (bypass RLS)
  const adminClient = createAdminClient();
  const { error } = await (adminClient as any)
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Revalidate relevant paths
  revalidatePath('/forum');
  revalidatePath(`/forum/topic/${(topic as any).slug}`);
  revalidatePath(`/forum/category/*`);

  return { success: true };
}

export async function togglePinTopicAction(topicId: string, isPinned: boolean) {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to update
  const adminClient = createAdminClient();
  const { error } = await (adminClient as any)
    .from('topics')
    .update({ is_pinned: isPinned })
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/forum');
  revalidatePath('/admin/topics');

  return { success: true };
}

export async function toggleLockTopicAction(topicId: string, isLocked: boolean) {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to update
  const adminClient = createAdminClient();
  const { error } = await (adminClient as any)
    .from('topics')
    .update({ is_locked: isLocked })
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/forum');
  revalidatePath('/admin/topics');

  return { success: true };
}

export async function moveTopicAction(topicId: string, newCategoryId: string) {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to update
  const adminClient = createAdminClient();
  const { error } = await (adminClient as any)
    .from('topics')
    .update({ category_id: newCategoryId })
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/forum');
  revalidatePath('/admin/topics');

  return { success: true };
}

export async function deleteReplyAction(replyId: string) {
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

  // Get reply to check ownership
  const { data: reply } = await supabase
    .from('replies')
    .select('author_id, topic_id')
    .eq('id', replyId)
    .single();

  if (!reply) {
    return { success: false, error: 'Reply not found' };
  }

  // Check if user is author or admin
  const isAuthor = (reply as any).author_id === user.id;
  const isAdmin = (profile as any)?.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to delete (bypass RLS)
  const adminClient = createAdminClient();
  const { error } = await (adminClient as any)
    .from('replies')
    .delete()
    .eq('id', replyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/forum');

  return { success: true };
}

export async function markSolutionAction(replyId: string, topicId: string) {
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

  // Get topic to check ownership and get slug for revalidation
  const { data: topic } = await supabase
    .from('topics')
    .select('author_id, slug')
    .eq('id', topicId)
    .single();

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  // Check if user is topic author or admin
  const isTopicAuthor = (topic as any).author_id === user.id;
  const isAdmin = (profile as any)?.role === 'admin';

  if (!isTopicAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' };
  }

  // Use admin client to update (bypass RLS)
  const adminClient = createAdminClient();

  // First, unmark any existing solutions
  const { error: unmarkError } = await (adminClient as any)
    .from('replies')
    .update({ is_solution: false })
    .eq('topic_id', topicId);

  if (unmarkError) {
    return { success: false, error: `Failed to unmark existing solutions: ${unmarkError.message}` };
  }

  // Then mark the new solution
  const { error: markError } = await (adminClient as any)
    .from('replies')
    .update({ is_solution: true })
    .eq('id', replyId);

  if (markError) {
    return { success: false, error: `Failed to mark solution: ${markError.message}` };
  }

  // Update topic to has_solution
  const { error: topicError } = await (adminClient as any)
    .from('topics')
    .update({ has_solution: true })
    .eq('id', topicId);

  if (topicError) {
    return { success: false, error: `Failed to update topic: ${topicError.message}` };
  }

  // Revalidate both forum and specific topic page
  revalidatePath('/forum');
  revalidatePath(`/forum/topic/${(topic as any).slug}`);

  return { success: true };
}
