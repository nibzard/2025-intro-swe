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

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id(username, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
  };
}
