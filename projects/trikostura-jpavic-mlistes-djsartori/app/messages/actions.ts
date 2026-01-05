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

  if (!conversations || conversations.length === 0) {
    return { conversations: [] };
  }

  // Get all other participant IDs
  const otherUserIds = conversations.map((conv: any) => 
    conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
  );

  // PARALLEL QUERIES: Fetch all profiles, messages, and unread counts at once
  const [
    { data: allProfiles },
    { data: allLastMessages },
    { data: allUnreadMessages }
  ] = await Promise.all([
    // Get all other users' profiles in one query
    supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .in('id', otherUserIds),
    // Get last message for each conversation in one query
    supabase
      .from('messages')
      .select('conversation_id, content, sender_id, created_at')
      .in('conversation_id', conversations.map((c: any) => c.id))
      .order('created_at', { ascending: false }),
    // Get unread counts
    supabase
      .from('messages')
      .select('conversation_id, is_read')
      .in('conversation_id', conversations.map((c: any) => c.id))
      .eq('is_read', false)
      .neq('sender_id', user.id)
  ]);

  // Create lookup maps for efficient access
  const profileMap = new Map((allProfiles || []).map((p: any) => [p.id, p]));
  
  // Group messages by conversation and get last message
  const lastMessageMap = new Map();
  (allLastMessages || []).forEach((msg: any) => {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg);
    }
  });

  // Count unread messages per conversation
  const unreadCountMap = new Map();
  (allUnreadMessages || []).forEach((msg: any) => {
    unreadCountMap.set(
      msg.conversation_id,
      (unreadCountMap.get(msg.conversation_id) || 0) + 1
    );
  });

  // Combine all data
  const conversationsWithDetails = conversations.map((conv: any) => {
    const otherUserId = conv.participant1_id === user.id
      ? conv.participant2_id
      : conv.participant1_id;

    return {
      ...conv,
      other_user: profileMap.get(otherUserId) || null,
      last_message: lastMessageMap.get(conv.id) || null,
      unread_count: unreadCountMap.get(conv.id) || 0,
    };
  });

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

  // Determine the recipient (the other person in the conversation)
  const recipientId = conversation.participant1_id === user.id
    ? conversation.participant2_id
    : conversation.participant1_id;

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

  // Get sender's username for notification
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  // Create notification for the recipient
  if (senderProfile) {
    const messagePreview = content.trim().length > 50
      ? content.trim().substring(0, 50) + '...'
      : content.trim();

    const { error: notificationError } = await (supabase as any).rpc('create_notification', {
      p_user_id: recipientId,
      p_type: 'new_message',
      p_title: 'Nova poruka',
      p_message: `${(senderProfile as any).username}: ${messagePreview}`,
      p_link: `/messages?conversation=${conversationId}`,
      p_actor_id: user.id,
    });

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
    }
  }

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
