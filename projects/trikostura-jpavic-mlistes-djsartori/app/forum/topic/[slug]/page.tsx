import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { TopicContent } from '@/components/forum/topic-content';
import { TopicControlMenu } from '@/components/forum/topic-control-menu';
import { EditableTopic } from '@/components/forum/editable-topic';
import { AdvancedAttachmentList } from '@/components/forum/advanced-attachment-list';
import { BookmarkButton } from '@/components/forum/bookmark-button';
import { TopicActions } from '@/components/forum/topic-actions';
import { MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';

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

  // Get topic with tags
  const { data: topic, error: topicError }: { data: any; error: any } = await supabase
    .from('topics')
    .select(`
      *,
      author:author_id(username, avatar_url, reputation),
      category:categories(name, slug, color, icon),
      topic_tags(tags(id, name, slug, color))
    `)
    .eq('slug', slug)
    .single();

  if (topicError) {
    console.error('Topic fetch error:', topicError);
    notFound();
  }

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
    .order('is_solution', { ascending: false })
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
  let isBookmarked = false;

  if (user) {
    if (replies) {
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

    // Check bookmark status
    const { data: bookmark } = await (supabase as any)
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('topic_id', topic.id)
      .single();

    isBookmarked = !!bookmark;
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

  // Check if topic has a solution
  const hasSolution = replies?.some((r: any) => r.is_solution);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/forum/category/${(topic.category as any)?.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na {(topic.category as any)?.name}
          </Button>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <BookmarkButton
              topicId={topic.id}
              initialBookmarked={isBookmarked}
              showText
            />
            <TopicActions topicId={topic.id} isAuthor={isAuthor} />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1 text-sm font-semibold rounded-full"
                style={{
                  backgroundColor: (topic.category as any)?.color + '20',
                  color: (topic.category as any)?.color,
                }}
              >
                {(topic.category as any)?.icon} {(topic.category as any)?.name}
              </span>
              {topic.topic_tags?.map((topicTag: any) => (
                <span
                  key={topicTag.tags.id}
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: topicTag.tags.color ? topicTag.tags.color + '15' : '#e5e7eb',
                    color: topicTag.tags.color || '#6b7280',
                  }}
                >
                  {topicTag.tags.name}
                </span>
              ))}
              {hasSolution && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Rijeseno
                </span>
              )}
              {topic.is_pinned && (
                <span className="text-yellow-500">📌 Prikvaceno</span>
              )}
              {topic.is_locked && (
                <span className="text-gray-500">🔒 Zakljucano</span>
              )}
            </div>

            <TopicControlMenu
              topic={topic}
              isAuthor={isAuthor}
              isAdmin={isAdmin}
              categories={categories || []}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{topic.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/forum/user/${(topic.author as any)?.username}`}>
                <Avatar
                  src={(topic.author as any)?.avatar_url}
                  alt={(topic.author as any)?.username || 'User'}
                  username={(topic.author as any)?.username}
                  size="md"
                />
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span>
                  Autor:{' '}
                  <Link
                    href={`/forum/user/${(topic.author as any)?.username}`}
                    className="font-semibold hover:underline"
                  >
                    {(topic.author as any)?.username}
                  </Link>
                </span>
                <span className="text-xs sm:text-sm">
                  {new Date(topic.created_at).toLocaleDateString('hr-HR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {topic.reply_count} odgovora
              </span>
              <span>{topic.view_count} pregleda</span>
            </div>
          </div>

          <EditableTopic
            topicId={topic.id}
            title={topic.title}
            content={topic.content}
            isAuthor={isAuthor}
            isAdmin={isAdmin}
            isLocked={topic.is_locked}
            editedAt={topic.edited_at}
            createdAt={topic.created_at}
          />
          <AdvancedAttachmentList attachments={topicAttachments || []} />
        </CardContent>
      </Card>

      <TopicContent
        topic={topic}
        replies={repliesWithAttachments || []}
        userVotes={userVotes}
        currentUserId={user?.id}
      />

      {topic.is_locked && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>Ova tema je zakljucana i ne mozete dodati nove odgovore.</p>
          </CardContent>
        </Card>
      )}

      {!user && !topic.is_locked && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Morate biti prijavljeni da biste mogli odgovoriti
            </p>
            <Link href="/auth/login">
              <Button>Prijavi se</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
