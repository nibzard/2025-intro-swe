import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReplyModerationClient } from './reply-moderation-client';

export const dynamic = 'force-dynamic';

export default async function RepliesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: replies } = await supabase
    .from('replies')
    .select(
      `
      *,
      author:profiles!replies_author_id_fkey(username, full_name, avatar_url),
      topic:topics(title, slug)
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Moderiranje Odgovora
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Pregledajte i moderirajte korisničke odgovore
        </p>
      </div>

      <ReplyModerationClient replies={replies || []} />
    </div>
  );
}
