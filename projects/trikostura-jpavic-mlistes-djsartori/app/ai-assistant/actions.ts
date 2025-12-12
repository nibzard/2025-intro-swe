'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Create a new AI conversation
 */
export async function createConversation() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  const { data, error } = await (supabase as any)
    .from('ai_conversations')
    .insert({
      user_id: user.id,
      title: 'Nova konverzacija',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return { error: 'Greška pri kreiranju konverzacije' };
  }

  return { conversation: data };
}

/**
 * Get user's conversations
 */
export async function getConversations() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  const { data, error } = await (supabase as any)
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching conversations:', error);
    return { error: 'Greška pri dohvaćanju konverzacija' };
  }

  return { conversations: data };
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  const { data, error } = await (supabase as any)
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return { error: 'Greška pri dohvaćanju poruka' };
  }

  return { messages: data };
}

/**
 * Send a message and get AI response
 */
export async function sendMessage(conversationId: string, message: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  // Save user message
  const { error: userMsgError } = await (supabase as any)
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

  if (userMsgError) {
    console.error('Error saving user message:', userMsgError);
    return { error: 'Greška pri spremanju poruke' };
  }

  // Get conversation history for context
  const { data: messages } = await (supabase as any)
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Search for relevant forum content
  const { data: relevantTopics } = await (supabase as any)
    .from('topics')
    .select('title, content')
    .textSearch('title', message.split(' ').slice(0, 3).join(' | '))
    .limit(3);

  // Build context
  let contextInfo = '';
  if (relevantTopics && relevantTopics.length > 0) {
    contextInfo = '\n\nRelevantne teme s foruma:\n';
    relevantTopics.forEach((topic: any) => {
      contextInfo += `- ${topic.title}\n`;
    });
  }

  // Prepare messages for AI
  const aiMessages = messages?.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  })) || [];

  // Call AI API
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return { error: 'AI servis nije konfiguriran' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `Ti si AI asistent za hrvatski studentski forum. Pomažeš studentima s pitanjima o učenju, domaćim zadacima i studijskim savjetima.

Tvoje karakteristike:
- Govoriš hrvatski jezik
- Pruža jasna i koncizna objašnjenja
- Pomažeš s razumijevanjem koncepata, ne dajući gotova rješenja
- Potičeš kritičko razmišljanje
- Prijazan si i motivirajuć
- Ako nešto ne znaš, iskreno to priznaš

Pravila:
- Ne rješavaš domaće zadaće potpuno, već pomaže s razumijevanjem
- Ne dajеš odgovore na ispitna pitanja
- Upućuješ na službene izvore kad je potrebno
- Uvijek odgovaraš na hrvatskom jeziku${contextInfo}`,
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('AI API error:', response.status, errorData);
      return { error: 'Greška pri komunikaciji s AI servisom' };
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.content[0]?.text || 'Žao mi je, ne mogu generirati odgovor.';

    // Save assistant response
    const { data: savedMessage, error: assistantMsgError } = await (supabase as any)
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        context_data: relevantTopics ? { relevantTopics } : null,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      return { error: 'Greška pri spremanju odgovora' };
    }

    revalidatePath('/ai-assistant');
    return { message: savedMessage };
  } catch (error: any) {
    console.error('Error calling AI API:', error);
    return { error: 'Greška pri pozivu AI servisa' };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  const { error } = await (supabase as any)
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting conversation:', error);
    return { error: 'Greška pri brisanju konverzacije' };
  }

  revalidatePath('/ai-assistant');
  return { success: true };
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, title: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Morate biti prijavljeni' };
  }

  const { error } = await (supabase as any)
    .from('ai_conversations')
    .update({ title })
    .eq('id', conversationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating conversation title:', error);
    return { error: 'Greška pri ažuriranju naslova' };
  }

  revalidatePath('/ai-assistant');
  return { success: true };
}
