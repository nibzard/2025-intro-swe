'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getConversations() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], error: 'Morate biti prijavljeni' };
  }

  const { data: conversations, error } = await (supabase as any)
    .from('conversations')
    .select(`
      id,
      last_message_at,
      participant1_id,
      participant2_id
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return { conversations: [], error: 'Greska pri dohvacanju razgovora' };
  }

  // Get other participant's profile and unread count for each conversation
  const conversationsWithDetails = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const otherUserId = conv.participant1_id === user.id
        ? conv.participant2_id
        : conv.participant1_id;

      // Get other user's profile
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .eq('id', otherUserId)
        .single();

      // Get last message
      const { data: lastMessage } = await (supabase as any)
        .from('messages')
        .select('content, sender_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count: unreadCount } = await (supabase as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      return {
        ...conv,
        other_user: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
      };
    })
  );

  return { conversations: conversationsWithDetails };
}

export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { conversationId: null, error: 'Morate biti prijavljeni' };
  }

  if (user.id === otherUserId) {
    return { conversationId: null, error: 'Ne mozete poslati poruku sami sebi' };
  }

  // Use the database function to get or create conversation
  const { data, error } = await (supabase as any)
    .rpc('get_or_create_conversation', {
      user1_id: user.id,
      user2_id: otherUserId,
    });

  if (error) {
    console.error('Error getting/creating conversation:', error);
    return { conversationId: null, error: 'Greska pri kreiranju razgovora' };
  }

  return { conversationId: data };
}

export async function getMessages(conversationId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], error: 'Morate biti prijavljeni' };
  }

  // Verify user is part of conversation
  const { data: conversation } = await (supabase as any)
    .from('conversations')
    .select('participant1_id, participant2_id')
    .eq('id', conversationId)
    .single();

  if (!conversation ||
      (conversation.participant1_id !== user.id && conversation.participant2_id !== user.id)) {
    return { messages: [], error: 'Nemate pristup ovom razgovoru' };
  }

  const { data: messages, error } = await (supabase as any)
    .from('messages')
    .select(`
      id,
      content,
      sender_id,
      is_read,
      created_at
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return { messages: [], error: 'Greska pri dohvacanju poruka' };
  }

  // Mark messages as read
  await (supabase as any)
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  return { messages: messages || [], currentUserId: user.id };
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  if (!content.trim()) {
    return { success: false, error: 'Poruka ne moze biti prazna' };
  }

  // Verify user is part of conversation
  const { data: conversation } = await (supabase as any)
    .from('conversations')
    .select('participant1_id, participant2_id')
    .eq('id', conversationId)
    .single();

  if (!conversation ||
      (conversation.participant1_id !== user.id && conversation.participant2_id !== user.id)) {
    return { success: false, error: 'Nemate pristup ovom razgovoru' };
  }

  // Insert message
  const { error: messageError } = await (supabase as any)
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    });

  if (messageError) {
    return { success: false, error: 'Greska pri slanju poruke' };
  }

  // Update conversation last_message_at
  await (supabase as any)
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath('/messages');
  return { success: true };
}

export async function getUnreadMessageCount() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0 };
  }

  // Get all user's conversations
  const { data: conversations } = await (supabase as any)
    .from('conversations')
    .select('id')
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

  if (!conversations || conversations.length === 0) {
    return { count: 0 };
  }

  const conversationIds = conversations.map((c: any) => c.id);

  // Count unread messages across all conversations
  const { count } = await (supabase as any)
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('is_read', false)
    .neq('sender_id', user.id);

  return { count: count || 0 };
}
