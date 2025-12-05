import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicContent } from '@/components/forum/topic-content';
import { TopicControlMenu } from '@/components/forum/topic-control-menu';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import { AdvancedAttachmentList } from '@/components/forum/advanced-attachment-list';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get topic
  const { data: topic }: { data: any } = await supabase
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url, reputation),
      category:categories(name, slug, color, icon)
    `)
    .eq('slug', slug)
    .single();

  if (!topic) {
    notFound();
  }

  // Increment view count
  try {
    await (supabase as any).rpc('increment', {
      table_name: 'topics',
      row_id: topic.id,
      column_name: 'view_count',
    });
  } catch {
    // Fallback if function doesn't exist
    await (supabase as any)
      .from('topics')
      .update({ view_count: topic.view_count + 1 })
      .eq('id', topic.id);
  }

  // Get topic attachments
  const { data: topicAttachments } = await supabase
    .from('attachments')
    .select('*')
    .eq('topic_id', topic.id);

  // Get replies with user vote info
  const { data: replies }: { data: any } = await supabase
    .from('replies')
    .select(`
      *,
      author:profiles!replies_author_id_fkey(username, avatar_url, reputation)
    `)
    .eq('topic_id', topic.id)
    .order('created_at', { ascending: true });

  // Get reply attachments
  const { data: replyAttachments } = await supabase
    .from('attachments')
    .select('*')
    .in('reply_id', replies?.map((r: any) => r.id) || []);

  // Map attachments to replies
  const repliesWithAttachments = replies?.map((reply: any) => ({
    ...reply,
    attachments: replyAttachments?.filter((att: any) => att.reply_id === reply.id) || [],
  }));

  // Get user votes for replies if user is logged in
  let userVotes: any = {};
  if (user && replies) {
    const { data: votes } = await supabase
      .from('votes')
      .select('reply_id, vote_type')
      .eq('user_id', user.id)
      .in(
        'reply_id',
        replies.map((r: any) => r.id)
      );

    votes?.forEach((vote: any) => {
      userVotes[vote.reply_id] = vote.vote_type;
    });
  }

  // Get user profile for permissions
  let userProfile: any = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userProfile = profile;
  }

  // Get all categories for move function
  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  const isAuthor = user?.id === topic.author_id;
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href={`/forum/category/${(topic.category as any)?.slug}`}>
          <Button variant="ghost" size="lg" className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">Natrag na {(topic.category as any)?.name}</span>
          </Button>
        </Link>
      </div>

      {/* Main topic card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
        <div className="p-8">
          {/* Topic header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 text-base font-bold rounded-xl shadow-lg"
                style={{
                  backgroundColor: (topic.category as any)?.color + '20',
                  color: (topic.category as any)?.color,
                }}
              >
                {(topic.category as any)?.icon} {(topic.category as any)?.name}
              </span>
              {topic.is_pinned && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-xl text-sm font-bold">
                  📌 Prikvačeno
                </span>
              )}
              {topic.is_locked && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold">
                  🔒 Zaključano
                </span>
              )}
            </div>

            <TopicControlMenu
              topic={topic}
              isAuthor={isAuthor}
              isAdmin={isAdmin}
              categories={categories || []}
            />
          </div>

          {/* Topic title */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 dark:text-white leading-tight">
            {topic.title}
          </h1>

          {/* Topic meta info */}
          <div className="flex items-center justify-between text-sm mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Autor:</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {(topic.author as any)?.username}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(topic.created_at).toLocaleDateString('hr-HR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-semibold">
                <MessageSquare className="w-5 h-5" />
                {topic.reply_count} odgovora
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl font-semibold">
                👁 {topic.view_count} pregleda
              </span>
            </div>
          </div>

          {/* Topic content */}
          <div className="prose prose-lg max-w-none dark:prose-invert mb-6">
            <MarkdownRenderer content={topic.content} />
          </div>
          <AdvancedAttachmentList attachments={topicAttachments || []} />
        </div>
      </div>

      <TopicContent
        topic={topic}
        replies={repliesWithAttachments || []}
        userVotes={userVotes}
        currentUserId={user?.id}
      />

      {/* Locked topic message */}
      {topic.is_locked && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-12 text-center border-2 border-gray-300 dark:border-gray-700">
          <div className="relative">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              Ova tema je zaključana
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Ne možete dodati nove odgovore.
            </p>
          </div>
        </div>
      )}

      {/* Login prompt */}
      {!user && !topic.is_locked && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-12 text-center border-2 border-blue-300 dark:border-blue-700">
          <div className="relative">
            <div className="text-6xl mb-4">👋</div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Morate biti prijavljeni da biste mogli odgovoriti
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Pridruži se zajednici i sudjeluj u diskusiji
            </p>
            <Link href="/auth/login">
              <Button className="px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                Prijavi se
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
