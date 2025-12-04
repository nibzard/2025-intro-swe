'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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

  return { supabase, userId: user.id };
}

// User Management Actions
export async function updateUserRole(userId: string, newRole: 'student' | 'admin') {
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  // Delete user profile (cascade will handle related data)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

// Topic Management Actions
export async function pinTopic(topicId: string, pinned: boolean) {
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  // Get max order_index
  const { data: maxOrder } = await supabase
    .from('categories')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from('categories').insert({
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
  await checkAdminAccess();
  const supabase: any = await createServerSupabaseClient();

  const { error } = await supabase
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
