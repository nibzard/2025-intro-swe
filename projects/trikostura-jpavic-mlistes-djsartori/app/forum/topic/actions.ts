'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
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

export async function recordTopicView(topicId: string) {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();

  // Get current user if logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Get or create session ID for anonymous users
  let sessionId = cookieStore.get('view_session_id')?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    // Try to set cookie, but don't fail if we can't (e.g., in Server Component)
    try {
      cookieStore.set('view_session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax',
      });
    } catch (error) {
      // Cookie setting failed (probably called from Server Component)
      // Continue with generated session ID for this request only
      console.log('Could not set session cookie, using temporary session ID');
    }
  }

  try {
    // Check if view already exists
    const { data: existingView, error: checkError } = await (supabase as any)
      .from('topic_views')
      .select('id')
      .eq('topic_id', topicId)
      .or(user ? `user_id.eq.${user.id}` : `session_id.eq.${sessionId}`)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing view:', checkError);
      return { success: false, error: checkError.message };
    }

    // If view doesn't exist, record it
    if (!existingView) {
      // Insert the view record
      const { error: insertError } = await (supabase as any)
        .from('topic_views')
        .insert({
          topic_id: topicId,
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
        });

      if (insertError) {
        console.error('Error inserting view record:', insertError);
        return { success: false, error: insertError.message };
      }

      // Increment the view count
      try {
        const { error: rpcError } = await (supabase as any).rpc('increment', {
          table_name: 'topics',
          row_id: topicId,
          column_name: 'view_count',
        });

        if (rpcError) throw rpcError;
      } catch (rpcError) {
        // Fallback: manually increment
        console.log('RPC increment failed, using fallback:', rpcError);
        const { data: topic, error: topicError } = await (supabase as any)
          .from('topics')
          .select('view_count')
          .eq('id', topicId)
          .maybeSingle();

        if (topicError) {
          console.error('Error fetching topic for increment:', topicError);
          return { success: false, error: topicError.message };
        }

        if (topic) {
          const { error: updateError } = await (supabase as any)
            .from('topics')
            .update({ view_count: (topic.view_count || 0) + 1 })
            .eq('id', topicId);

          if (updateError) {
            console.error('Error updating view count:', updateError);
            return { success: false, error: updateError.message };
          }
        }
      }

      return { success: true, newView: true };
    }

    return { success: true, newView: false };
  } catch (error) {
    console.error('Error in recordTopicView:', error);
    return { success: false };
  }
}
