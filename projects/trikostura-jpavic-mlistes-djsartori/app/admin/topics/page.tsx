import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TopicModerationClient } from './topic-moderation-client';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: topics } = await supabase
    .from('topics')
    .select(
      `
      *,
      author:profiles!topics_author_id_fkey(username, full_name, avatar_url),
      category:categories(name, color)
    `
    )
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Moderiranje Tema
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Zakači, zaključaj ili obriši teme
        </p>
      </div>

      <TopicModerationClient topics={topics || []} />
    </div>
  );
}
