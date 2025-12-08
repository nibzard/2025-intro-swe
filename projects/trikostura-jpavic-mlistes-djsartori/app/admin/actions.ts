'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function checkAdminAccess() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    redirect('/forum');
  }

  // Return admin client for elevated privileges
  return { adminClient: createAdminClient(), userId: user.id };
}

// User Management Actions
export async function updateUserRole(userId: string, newRole: 'student' | 'admin') {
  const { adminClient, userId: adminId } = await checkAdminAccess();

  // Prevent admin from removing their own admin role
  if (userId === adminId && newRole !== 'admin') {
    return { success: false, error: 'Ne mozete ukloniti vlastitu admin ulogu' };
  }

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function banUser(userId: string, reason?: string) {
  const { adminClient, userId: adminId } = await checkAdminAccess();

  // Prevent admin from banning themselves
  if (userId === adminId) {
    return { success: false, error: 'Ne mozete banirati sami sebe' };
  }

  // Check if target user is also admin
  const { data: targetProfile } = await (adminClient as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (targetProfile?.role === 'admin') {
    return { success: false, error: 'Ne mozete banirati drugog admina' };
  }

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      ban_reason: reason || null,
      banned_by: adminId,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function unbanUser(userId: string) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      ban_reason: null,
      banned_by: null,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const { adminClient } = await checkAdminAccess();

  // Delete user profile (cascade will handle related data)
  const { error } = await (adminClient as any)
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function warnUser(userId: string, reason: string) {
  const { userId: adminId } = await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  // Prevent admin from warning themselves
  if (userId === adminId) {
    return { success: false, error: 'Ne mozete upozoriti sami sebe' };
  }

  // Check if target user is also admin
  const { data: targetProfile } = await (adminClient as any)
    .from('profiles')
    .select('role, warning_count')
    .eq('id', userId)
    .single();

  if (targetProfile?.role === 'admin') {
    return { success: false, error: 'Ne mozete upozoriti drugog admina' };
  }

  // Update profile warning count
  const { error: profileError } = await (adminClient as any)
    .from('profiles')
    .update({
      warning_count: (targetProfile?.warning_count || 0) + 1,
      last_warning_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Create warning record
  const { error: warningError } = await (adminClient as any)
    .from('user_warnings')
    .insert({
      user_id: userId,
      admin_id: adminId,
      reason: reason,
      warning_type: 'warning',
    });

  if (warningError) {
    return { success: false, error: warningError.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function timeoutUser(userId: string, reason: string, durationHours: number) {
  const { userId: adminId } = await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  // Prevent admin from timing out themselves
  if (userId === adminId) {
    return { success: false, error: 'Ne mozete staviti sami sebe u timeout' };
  }

  // Check if target user is also admin
  const { data: targetProfile } = await (adminClient as any)
    .from('profiles')
    .select('role, warning_count')
    .eq('id', userId)
    .single();

  if (targetProfile?.role === 'admin') {
    return { success: false, error: 'Ne mozete staviti drugog admina u timeout' };
  }

  // Calculate timeout end time
  const timeoutUntil = new Date();
  timeoutUntil.setHours(timeoutUntil.getHours() + durationHours);

  // Update profile with timeout
  const { error: profileError } = await (adminClient as any)
    .from('profiles')
    .update({
      timeout_until: timeoutUntil.toISOString(),
      timeout_reason: reason,
      warning_count: (targetProfile?.warning_count || 0) + 1,
      last_warning_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Create warning record
  const { error: warningError } = await (adminClient as any)
    .from('user_warnings')
    .insert({
      user_id: userId,
      admin_id: adminId,
      reason: reason,
      warning_type: 'timeout',
      timeout_duration: durationHours,
    });

  if (warningError) {
    return { success: false, error: warningError.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function removeTimeout(userId: string) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('profiles')
    .update({
      timeout_until: null,
      timeout_reason: null,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

// Topic Management Actions
export async function pinTopic(topicId: string, pinned: boolean) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('topics')
    .update({ is_pinned: pinned })
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/topics');
  revalidatePath('/forum');
  return { success: true };
}

export async function lockTopic(topicId: string, locked: boolean) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('topics')
    .update({ is_locked: locked })
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/topics');
  revalidatePath('/forum');
  return { success: true };
}

export async function deleteTopic(topicId: string) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('topics')
    .delete()
    .eq('id', topicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/topics');
  revalidatePath('/forum');
  return { success: true };
}

// Reply Management Actions
export async function deleteReply(replyId: string) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('replies')
    .delete()
    .eq('id', replyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/replies');
  return { success: true };
}

// Category Management Actions
export async function createCategory(data: {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}) {
  const { adminClient } = await checkAdminAccess();

  // Get max order_index
  const { data: maxOrder } = await (adminClient as any)
    .from('categories')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const { error } = await (adminClient as any).from('categories').insert({
    ...data,
    order_index: (maxOrder?.order_index || 0) + 1,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/forum');
  return { success: true };
}

export async function updateCategory(
  categoryId: string,
  data: {
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
  }
) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('categories')
    .update(data)
    .eq('id', categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/forum');
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const { adminClient } = await checkAdminAccess();

  const { error } = await (adminClient as any)
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/forum');
  return { success: true };
}
