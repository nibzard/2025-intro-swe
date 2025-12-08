'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function followUser(targetUserId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  if (user.id === targetUserId) {
    return { success: false, error: 'Ne mozete pratiti sami sebe' };
  }

  const { error } = await (supabase as any)
    .from('user_follows')
    .insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Vec pratite ovog korisnika' };
    }
    console.error('Follow error:', error);
    return { success: false, error: 'Greska pri pracenju korisnika' };
  }

  // Get follower's username for notification
  const { data: followerProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  // Create notification for the followed user
  if (followerProfile) {
    await (supabase as any).rpc('create_notification', {
      p_user_id: targetUserId,
      p_type: 'follow',
      p_title: 'Novi pratitelj',
      p_message: `${followerProfile.username} te sada prati`,
      p_link: `/forum/user/${followerProfile.username}`,
      p_actor_id: user.id,
    });
  }

  revalidatePath('/forum/user');
  return { success: true };
}

export async function unfollowUser(targetUserId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  const { error } = await (supabase as any)
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) {
    console.error('Unfollow error:', error);
    return { success: false, error: 'Greska pri otpracivanju korisnika' };
  }

  revalidatePath('/forum/user');
  return { success: true };
}

export async function getFollowStatus(targetUserId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isFollowing: false };
  }

  const { data } = await (supabase as any)
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  return { isFollowing: !!data };
}

export async function getFollowers(userId: string, limit = 20, offset = 0) {
  const supabase = await createServerSupabaseClient();

  const { data: follows, count } = await (supabase as any)
    .from('user_follows')
    .select(`
      id,
      created_at,
      follower:profiles!user_follows_follower_id_fkey(id, username, avatar_url, full_name)
    `, { count: 'exact' })
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    followers: follows?.map((f: any) => f.follower) || [],
    total: count || 0,
  };
}

export async function getFollowing(userId: string, limit = 20, offset = 0) {
  const supabase = await createServerSupabaseClient();

  const { data: follows, count } = await (supabase as any)
    .from('user_follows')
    .select(`
      id,
      created_at,
      following:profiles!user_follows_following_id_fkey(id, username, avatar_url, full_name)
    `, { count: 'exact' })
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    following: follows?.map((f: any) => f.following) || [],
    total: count || 0,
  };
}
