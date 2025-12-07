'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const EditReplySchema = z.object({
  replyId: z.string().uuid(),
  content: z.string().min(1, 'Sadržaj je obavezan').max(10000, 'Sadržaj može imati maksimalno 10000 znakova'),
});

export async function editReply(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Morate biti prijavljeni' };
    }

    // Validate input
    const validatedData = EditReplySchema.parse({
      replyId: formData.get('replyId'),
      content: formData.get('content'),
    });

    // Get the reply to check ownership and topic status
    const { data: reply, error: fetchError } = await supabase
      .from('replies')
      .select('author_id, topic_id, topics!inner(slug, is_locked)')
      .eq('id', validatedData.replyId)
      .single();

    if (fetchError || !reply) {
      return { success: false, error: 'Odgovor nije pronađen' };
    }

    // Cast to any to access nested topic data
    const replyData = reply as any;

    // Check if topic is locked
    const topic = replyData.topics;
    if (topic?.is_locked) {
      return { success: false, error: 'Tema je zaključana i odgovori se ne mogu uređivati' };
    }

    // Check if user is the author or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = replyData.author_id === user.id;
    const isAdmin = (profile as any)?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Nemate dozvolu za uređivanje ovog odgovora' };
    }

    // Update the reply
    const { error: updateError } = await (supabase as any)
      .from('replies')
      .update({
        content: validatedData.content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', validatedData.replyId);

    if (updateError) {
      return { success: false, error: 'Greška pri ažuriranju odgovora' };
    }

    // Revalidate the topic page
    revalidatePath(`/forum/topic/${topic.slug}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Došlo je do greške' };
  }
}
