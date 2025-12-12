import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreateTopicPage } from './create-topic-page';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nova tema | Studentski Forum',
  description: 'Stvori novu temu na forumu',
};

export default async function NewTopicServerPage() {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Load categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  // Load tags
  const { data: tags } = await supabase.from('tags').select('*').order('name');

  // Load existing draft
  const { data: draft } = await supabase
    .from('topic_drafts')
    .select('*')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <CreateTopicPage
      categories={categories || []}
      tags={tags || []}
      initialDraft={draft}
    />
  );
}
