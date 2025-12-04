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
      author:profiles!topics_author_id_fkey(username, full_name),
      category:categories(name, color)
    `
    )
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Topic Moderation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Pin, lock, or delete topics
        </p>
      </div>

      <TopicModerationClient topics={topics || []} />
    </div>
  );
}
