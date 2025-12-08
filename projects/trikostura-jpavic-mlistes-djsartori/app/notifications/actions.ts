'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markNotificationAsRead(notificationId: string) {
  const supabase: any = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase: any = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const supabase: any = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function getNotifications() {
  const supabase: any = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data: notificationData, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }

  if (!notificationData || notificationData.length === 0) {
    return { notifications: [], unreadCount: 0 };
  }

  // Get unique actor IDs
  const actorIds = [...new Set(notificationData.map((n: any) => n.actor_id).filter(Boolean))];

  // Fetch actors separately
  const { data: actorsData } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', actorIds);

  // Create a map for quick lookup
  const actorsMap = new Map((actorsData || []).map((a: any) => [a.id, a]));

  // Combine notifications with actor data
  const notifications = notificationData.map((n: any) => ({
    ...n,
    actor: n.actor_id ? actorsMap.get(n.actor_id) : null,
  }));

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
  };
}
