'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleBookmark(topicId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  // Check if already bookmarked
  const { data: existing, error: checkError } = await (supabase as any)
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Bookmark check error:', checkError);
    return { success: false, error: 'Greska pri provjeri oznake' };
  }

  if (existing) {
    // Remove bookmark
    const { error } = await (supabase as any)
      .from('bookmarks')
      .delete()
      .eq('id', existing.id);

    if (error) {
      console.error('Bookmark delete error:', error);
      return { success: false, error: 'Greska pri uklanjanju oznake' };
    }

    revalidatePath('/forum');
    revalidatePath(`/forum/bookmarks`);
    revalidatePath(`/forum/topic`);
    return { success: true, bookmarked: false };
  } else {
    // Add bookmark
    const { data: newBookmark, error } = await (supabase as any)
      .from('bookmarks')
      .insert({
        user_id: user.id,
        topic_id: topicId,
      })
      .select();

    if (error) {
      console.error('Bookmark insert error:', error);
      return { success: false, error: 'Greska pri spremanju oznake' };
    }

    if (!newBookmark || newBookmark.length === 0) {
      return { success: false, error: 'Greska pri spremanju oznake' };
    }

    revalidatePath('/forum');
    revalidatePath(`/forum/bookmarks`);
    revalidatePath(`/forum/topic`);
    return { success: true, bookmarked: true };
  }
}

export async function getBookmarkStatus(topicId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { bookmarked: false };
  }

  const { data: existing } = await (supabase as any)
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .single();

  return { bookmarked: !!existing };
}

export async function getUserBookmarks() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { bookmarks: [], error: 'Morate biti prijavljeni' };
  }

  const { data: bookmarks, error } = await (supabase as any)
    .from('bookmarks')
    .select(`
      id,
      created_at,
      topic:topics(
        id,
        title,
        slug,
        created_at,
        reply_count,
        view_count,
        has_solution,
        author:profiles!topics_author_id_fkey(username, avatar_url),
        category:categories(name, slug, color)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { bookmarks: [], error: 'Greska pri dohvacanju oznaka' };
  }

  return { bookmarks: bookmarks || [] };
}
