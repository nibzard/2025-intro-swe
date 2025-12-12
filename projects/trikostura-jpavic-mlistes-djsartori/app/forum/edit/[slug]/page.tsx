import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EditTopicClient } from './edit-topic-client';

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get topic
  const { data: topic }: { data: any } = await supabase
    .from('topics')
    .select('*, author:profiles!topics_author_id_fkey(username)')
    .eq('slug', slug)
    .single();

  if (!topic) {
    notFound();
  }

  // Get user profile for permissions
  const { data: userProfile }: { data: any } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAuthor = user.id === topic.author_id;
  const isAdmin = userProfile?.role === 'admin';

  // Check permissions
  if (!isAuthor && !isAdmin) {
    redirect(`/forum/topic/${slug}`);
  }

  // Check if topic is locked (only admins can edit locked topics)
  if (topic.is_locked && !isAdmin) {
    redirect(`/forum/topic/${slug}`);
  }

  return (
    <EditTopicClient
      topic={topic}
    />
  );
}
