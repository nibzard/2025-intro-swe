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
import { recordTopicView } from '../actions';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import { MessageSquare, CheckCircle } from 'lucide-react';

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

  // Run all topic-related queries in parallel
  const [
    { data: author },
    { data: category },
    { data: tagData },
    { data: topicAttachments },
    { data: replies }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_url, reputation')
      .eq('id', topic.author_id)
      .single() as any,
    supabase
      .from('categories')
      .select('name, slug, color, icon')
      .eq('id', topic.category_id)
      .single() as any,
    supabase
      .from('topic_tags')
      .select('tags(id, name, slug, color)')
      .eq('topic_id', topic.id),
    supabase
      .from('attachments')
      .select('*')
      .eq('topic_id', topic.id),
    supabase
      .from('replies')
      .select('*')
      .eq('topic_id', topic.id)
      .order('is_solution', { ascending: false })
      .order('created_at', { ascending: true })
  ]);

  // Restructure topic data to match expected format
  const enrichedTopic = {
    ...topic,
    author,
    category,
    topic_tags: tagData || [],
  };

  // Record unique view (only counts once per user/session)
  // Non-blocking: page should load even if view tracking fails
  try {
    const result = await recordTopicView(topic.id);
    if (!result.success) {
      console.error('Failed to record topic view:', result.error || 'Unknown error');
    } else {
      console.log('View tracking result:', result.newView ? 'New view recorded' : 'View already exists');
    }
  } catch (error) {
    console.error('Exception in recordTopicView:', error);
    // Continue loading the page even if view tracking fails
  }

  // Get reply authors and attachments in parallel (if there are replies)
  const replyAuthorIds = replies?.map((r: any) => r.author_id).filter(Boolean) || [];
  let replyAuthors: any = {};
  let replyAttachments: any[] = [];

  if (replyAuthorIds.length > 0) {
    const [
      { data: authors },
      { data: attachments }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, avatar_url, reputation')
        .in('id', [...new Set(replyAuthorIds)]),
      supabase
        .from('attachments')
        .select('*')
        .in('reply_id', replies?.map((r: any) => r.id) || [])
    ]);

    if (authors) {
      authors.forEach((a: any) => {
        replyAuthors[a.id] = a;
      });
    }

    replyAttachments = attachments || [];
  }

  // Enrich replies with author data
  const enrichedReplies = (replies || []).map((reply: any) => ({
    ...reply,
    author: replyAuthors[reply.author_id],
  }));

  // Use enriched replies for rest of code
  const repliesList = enrichedReplies;

  // Map attachments to replies
  const repliesWithAttachments = repliesList?.map((reply: any) => ({
    ...reply,
    attachments: replyAttachments?.filter((att: any) => att.reply_id === reply.id) || [],
  }));

  // Get user-specific data in parallel (votes, bookmarks, profile)
  let userVotes: any = {};
  let isBookmarked = false;
  let userProfile: any = null;

  if (user) {
    const userQueries = [
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any
    ];

    if (repliesList && repliesList.length > 0) {
      userQueries.push(
        supabase
          .from('votes')
          .select('reply_id, vote_type')
          .eq('user_id', user.id)
          .in('reply_id', repliesList.map((r: any) => r.id)) as any
      );
    } else {
      userQueries.push(Promise.resolve({ data: null }));
    }

    userQueries.push(
      supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topic.id)
        .maybeSingle() as any
    );

    const [
      { data: profile },
      { data: votes },
      { data: bookmark }
    ] = await Promise.all(userQueries);

    userProfile = profile;
    isBookmarked = !!bookmark;

    votes?.forEach((vote: any) => {
      userVotes[vote.reply_id] = vote.vote_type;
    });
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
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: 'Forum', href: '/forum' },
            { label: category?.name || 'Category', href: `/forum/category/${category?.slug}` },
            { label: topic.title },
          ]}
        />

        {user && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <BookmarkButton
              topicId={enrichedTopic.id}
              initialBookmarked={isBookmarked}
              showText
            />
            <TopicActions topicId={enrichedTopic.id} isAuthor={isAuthor} />
          </div>
        )}
      </div>

      <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-4 py-1.5 text-sm font-bold rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105"
                style={{
                  backgroundColor: category?.color + '25',
                  color: category?.color,
                }}
              >
                <span className="text-base mr-1.5">{category?.icon}</span>
                {category?.name}
              </span>
              {enrichedTopic.topic_tags?.map((topicTag: any) => (
                <span
                  key={topicTag.tags.id}
                  className="px-3 py-1 text-xs font-semibold rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105"
                  style={{
                    backgroundColor: topicTag.tags.color ? topicTag.tags.color + '20' : '#e5e7eb',
                    color: topicTag.tags.color || '#6b7280',
                  }}
                >
                  {topicTag.tags.name}
                </span>
              ))}
              {hasSolution && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 rounded-full shadow-sm ring-1 ring-green-500/20 transition-transform hover:scale-105">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Riješeno
                </span>
              )}
              {enrichedTopic.is_pinned && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-700 dark:text-yellow-300 rounded-full shadow-sm ring-1 ring-yellow-500/20">
                  📌 Prikvačeno
                </span>
              )}
              {enrichedTopic.is_locked && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-sm ring-1 ring-gray-500/20">
                  🔒 Zaključano
                </span>
              )}
            </div>

            <TopicControlMenu
              topic={enrichedTopic}
              isAuthor={isAuthor}
              isAdmin={isAdmin}
              categories={categories || []}
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">{enrichedTopic.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-4">
              <Link href={`/forum/user/${author?.username}`} className="flex-shrink-0 transition-transform hover:scale-110">
                <Avatar
                  src={author?.avatar_url}
                  alt={author?.username || 'User'}
                  username={author?.username}
                  size="md"
                />
              </Link>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Autor:</span>
                  <Link
                    href={`/forum/user/${author?.username}`}
                    className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {author?.username}
                  </Link>
                  {author?.reputation > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">
                      {author.reputation} rep
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{enrichedTopic.reply_count}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">odgovora</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">{enrichedTopic.view_count}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">pregleda</span>
              </div>
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
