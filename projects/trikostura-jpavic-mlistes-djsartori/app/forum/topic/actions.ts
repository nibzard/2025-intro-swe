'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const EditTopicSchema = z.object({
  topicId: z.string().uuid(),
  title: z.string().min(1, 'Naslov je obavezan').max(200, 'Naslov može imati maksimalno 200 znakova'),
  content: z.string().min(1, 'Sadržaj je obavezan').max(10000, 'Sadržaj može imati maksimalno 10000 znakova'),
});

export async function editTopic(formData: FormData) {
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
    const validatedData = EditTopicSchema.parse({
      topicId: formData.get('topicId'),
      title: formData.get('title'),
      content: formData.get('content'),
    });

    // Get the topic to check ownership and locked status
    const { data: topic, error: fetchError } = await supabase
      .from('topics')
      .select('author_id, is_locked, slug')
      .eq('id', validatedData.topicId)
      .single();

    if (fetchError || !topic) {
      return { success: false, error: 'Tema nije pronađena' };
    }

    // Cast to any to access properties
    const topicData = topic as any;

    // Check if topic is locked
    if (topicData.is_locked) {
      return { success: false, error: 'Tema je zaključana i ne može se uređivati' };
    }

    // Check if user is the author or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = topicData.author_id === user.id;
    const isAdmin = (profile as any)?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Nemate dozvolu za uređivanje ove teme' };
    }

    // Update the topic
    const { error: updateError } = await (supabase as any)
      .from('topics')
      .update({
        title: validatedData.title.trim(),
        content: validatedData.content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', validatedData.topicId);

    if (updateError) {
      return { success: false, error: 'Greška pri ažuriranju teme' };
    }

    // Revalidate the topic page
    revalidatePath(`/forum/topic/${topicData.slug}`);
    revalidatePath('/forum');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Došlo je do greške' };
  }
}
