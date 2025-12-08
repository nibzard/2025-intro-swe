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

  // Get topic with tags - simplified query without complex relationships
  const { data: topic, error: topicError }: { data: any; error: any } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (topicError) {
    console.error('Topic fetch error:', topicError);
    notFound();
  }

  if (!topic) {
    console.error('Topic not found for slug:', slug);
    notFound();
  }

  // Get author separately
  const { data: author } = await supabase
    .from('profiles')
    .select('username, avatar_url, reputation')
    .eq('id', topic.author_id)
    .single() as any;

  // Get category separately
  const { data: category } = await supabase
    .from('categories')
    .select('name, slug, color, icon')
    .eq('id', topic.category_id)
    .single() as any;

  // Get topic tags separately
  const { data: tagData } = await supabase
    .from('topic_tags')
    .select('tags(id, name, slug, color)')
    .eq('topic_id', topic.id);

  // Restructure topic data to match expected format
  const enrichedTopic = {
    ...topic,
    author,
    category,
    topic_tags: tagData || [],
  };

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

  // Get replies without complex relationships
  const { data: replies }: { data: any } = await supabase
    .from('replies')
    .select('*')
    .eq('topic_id', topic.id)
    .order('is_solution', { ascending: false })
    .order('created_at', { ascending: true });

  // Get reply authors separately if needed
  const replyAuthorIds = replies?.map((r: any) => r.author_id).filter(Boolean) || [];
  let replyAuthors: any = {};
  if (replyAuthorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, reputation')
      .in('id', [...new Set(replyAuthorIds)]);
    
    if (authors) {
      authors.forEach((a: any) => {
        replyAuthors[a.id] = a;
      });
    }
  }

  // Enrich replies with author data
  const enrichedReplies = (replies || []).map((reply: any) => ({
    ...reply,
    author: replyAuthors[reply.author_id],
  }));

  // Use enriched replies for rest of code
  const repliesList = enrichedReplies;

  // Get reply attachments
  const { data: replyAttachments } = await supabase
    .from('attachments')
    .select('*')
    .in('reply_id', replies?.map((r: any) => r.id) || []);

  // Map attachments to replies
  const repliesWithAttachments = repliesList?.map((reply: any) => ({
    ...reply,
    attachments: replyAttachments?.filter((att: any) => att.reply_id === reply.id) || [],
  }));

  // Get user votes for replies if user is logged in
  let userVotes: any = {};
  let isBookmarked = false;

  if (user) {
    if (repliesList) {
      const { data: votes } = await supabase
        .from('votes')
        .select('reply_id, vote_type')
        .eq('user_id', user.id)
        .in(
          'reply_id',
          repliesList.map((r: any) => r.id)
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
  const hasSolution = repliesList?.some((r: any) => r.is_solution);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/forum/category/${category?.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na {category?.name}
          </Button>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <BookmarkButton
              topicId={enrichedTopic.id}
              initialBookmarked={isBookmarked}
              showText
            />
            <TopicActions topicId={enrichedTopic.id} isAuthor={isAuthor} />
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
                  backgroundColor: category?.color + '20',
                  color: category?.color,
                }}
              >
                {category?.icon} {category?.name}
              </span>
              {enrichedTopic.topic_tags?.map((topicTag: any) => (
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
              {enrichedTopic.is_pinned && (
                <span className="text-yellow-500">📌 Prikvaceno</span>
              )}
              {enrichedTopic.is_locked && (
                <span className="text-gray-500">🔒 Zakljucano</span>
              )}
            </div>

            <TopicControlMenu
              topic={enrichedTopic}
              isAuthor={isAuthor}
              isAdmin={isAdmin}
              categories={categories || []}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{enrichedTopic.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/forum/user/${author?.username}`}>
                <Avatar
                  src={author?.avatar_url}
                  alt={author?.username || 'User'}
                  username={author?.username}
                  size="md"
                />
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span>
                  Autor:{' '}
                  <Link
                    href={`/forum/user/${author?.username}`}
                    className="font-semibold hover:underline"
                  >
                    {author?.username}
                  </Link>
                </span>
                <span className="text-xs sm:text-sm">
                  {new Date(enrichedTopic.created_at).toLocaleDateString('hr-HR', {
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
                {enrichedTopic.reply_count} odgovora
              </span>
              <span>{enrichedTopic.view_count} pregleda</span>
            </div>
          </div>

          <EditableTopic
            topicId={enrichedTopic.id}
            title={enrichedTopic.title}
            content={enrichedTopic.content}
            isAuthor={isAuthor}
            isAdmin={isAdmin}
            isLocked={enrichedTopic.is_locked}
            editedAt={enrichedTopic.edited_at}
            createdAt={enrichedTopic.created_at}
          />
          <AdvancedAttachmentList attachments={topicAttachments || []} />
        </CardContent>
      </Card>

      <TopicContent
        topic={enrichedTopic}
        replies={repliesWithAttachments || []}
        userVotes={userVotes}
        currentUserId={user?.id}
      />

      {enrichedTopic.is_locked && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>Ova tema je zakljucana i ne mozete dodati nove odgovore.</p>
          </CardContent>
        </Card>
      )}

      {!user && !enrichedTopic.is_locked && (
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
