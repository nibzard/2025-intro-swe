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
import { ReactionPicker } from '@/components/forum/reaction-picker';
import { PollWidget } from '@/components/forum/poll-widget';
import { PollCreator } from '@/components/forum/poll-creator';
import { TypingIndicator } from '@/components/forum/typing-indicator';
import { getPollDetails } from '@/app/forum/polls/actions';

// Revalidate every 2 minutes for better cache performance
export const revalidate = 120;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: topic } = await supabase
    .from('topics')
    .select('title, content')
    .eq('slug', slug)
    .single();

  if (!topic) {
    return {
      title: 'Tema nije pronađena',
    };
  }

  const topicData = topic as any;
  const description = topicData.content?.substring(0, 160) || 'Pogledajte ovu temu na Skripta forumu';

  return {
    title: `${topicData.title} | Skripta Forum`,
    description,
    openGraph: {
      title: topicData.title,
      description,
      type: 'article',
    },
  };
}

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

  // Get topic with all related data in ONE query (without tags for now)
  const { data: topic, error: topicError }: { data: any; error: any } = await supabase
    .from('topics')
    .select(`
      *,
      author:profiles!topics_author_id_fkey(username, avatar_url, reputation),
      category:categories!topics_category_id_fkey(name, slug, color, icon)
    `)
    .eq('slug', slug)
    .maybeSingle();

  // Only return 404 if topic doesn't exist, not on query errors
  if (!topic) {
    console.error('Topic not found for slug:', slug);
    if (topicError) {
      console.error('Topic fetch error:', topicError);
    }
    notFound();
  }

  // PARALLEL QUERIES: Fetch replies, tags, categories, reactions, and poll all at once
  const results = await Promise.all([
    supabase
      .from('replies')
      .select(`
        *,
        author:profiles!replies_author_id_fkey(id, username, avatar_url, reputation)
      `)
      .eq('topic_id', topic.id)
      .order('is_solution', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('topic_tags')
      .select('tags(id, name, slug, color)')
      .eq('topic_id', topic.id),
    supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true }),
    // Reactions query - with error handling for when table doesn't exist
    (supabase as any)
      .from('reactions')
      .select('id, emoji, user_id, created_at')
      .eq('topic_id', topic.id)
      .then((res: any) => res)
      .catch((err: any) => ({ data: null, error: err })),
    // Placeholder for reply reactions - will fetch after we have replies
    Promise.resolve({ data: null }),
    // Poll query - with error handling for when table doesn't exist
    (supabase as any)
      .from('polls')
      .select('id, topic_id, question, allow_multiple_choices, expires_at, created_at')
      .eq('topic_id', topic.id)
      .maybeSingle()
      .then((res: any) => res)
      .catch((err: any) => ({ data: null, error: err }))
  ]);

  // Extract data from results
  const replies = results[0].data;
  const topicTags = results[1].data;
  const categories = results[2].data;
  const topicReactions = results[3].data;
  let replyReactionsData: any = results[4].data;
  const pollData = results[5].data;

  // Now fetch reply reactions if we have replies
  if (replies && replies.length > 0) {
    try {
      const { data } = await (supabase as any)
        .from('reactions')
        .select('id, emoji, user_id, created_at, reply_id')
        .not('reply_id', 'is', null)
        .in('reply_id', replies.map((r: any) => r.id));
      replyReactionsData = data;
    } catch (err) {
      console.error('Failed to fetch reply reactions:', err);
      replyReactionsData = null;
    }
  }

  // Attach tags to topic
  topic.topic_tags = topicTags || [];

  // Get ALL attachments (topic + replies) in one query - only if there are replies
  const { data: allAttachments } = await supabase
    .from('attachments')
    .select('*')
    .or(`topic_id.eq.${topic.id}${replies && replies.length > 0 ? `,reply_id.in.(${replies.map((r: any) => r.id).join(',')})` : ''}`);

  const topicAttachments = allAttachments?.filter((a: any) => a.topic_id === topic.id) || [];
  const replyAttachments = allAttachments?.filter((a: any) => a.reply_id) || [];

  // Record unique view (only counts once per user/session)
  // Non-blocking: page should load even if view tracking fails
  recordTopicView(topic.id).catch(err => console.error('View tracking failed:', err));

  // Map attachments and reactions to replies
  const repliesWithAttachments = (replies || []).map((reply: any) => ({
    ...reply,
    attachments: replyAttachments?.filter((att: any) => att.reply_id === reply.id) || [],
    reactions: replyReactionsData?.filter((r: any) => r.reply_id === reply.id) || [],
  }));

  // Get poll details if poll exists
  let pollDetails = null;
  if (pollData) {
    try {
      const details = await getPollDetails((pollData as any).id);
      if (!details.error) {
        pollDetails = details;
      }
    } catch (err) {
      console.error('Failed to fetch poll details:', err);
      pollDetails = null;
    }
  }

  // Get user-specific data in parallel (votes, bookmarks, profile)
  let userVotes: any = {};
  let isBookmarked = false;
  let userProfile: any = null;

  if (user) {
    const [
      { data: profile },
      { data: votes },
      { data: bookmark }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single(),
      replies && replies.length > 0
        ? supabase
            .from('votes')
            .select('reply_id, vote_type')
            .eq('user_id', user.id)
            .in('reply_id', replies.map((r: any) => r.id))
        : Promise.resolve({ data: null }),
      supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topic.id)
        .maybeSingle()
    ]);

    userProfile = profile;
    isBookmarked = !!bookmark;

    votes?.forEach((vote: any) => {
      userVotes[vote.reply_id] = vote.vote_type;
    });
  }

  const isAuthor = user?.id === topic.author_id;
  const isAdmin = userProfile?.role === 'admin';

  // Check if topic has a solution
  const hasSolution = replies?.some((r: any) => r.is_solution);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: 'Forum', href: '/forum' },
            { label: topic.category?.name || 'Category', href: `/forum/category/${topic.category?.slug}` },
            { label: topic.title },
          ]}
        />

        {user && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <BookmarkButton
              topicId={topic.id}
              initialBookmarked={isBookmarked}
              showText
            />
            <TopicActions topicId={topic.id} isAuthor={isAuthor} />
          </div>
        )}
      </div>

      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-4 py-1.5 text-sm font-bold rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105"
                style={{
                  backgroundColor: topic.category?.color + '25',
                  color: topic.category?.color,
                }}
              >
                <span className="text-base mr-1.5">{topic.category?.icon}</span>
                {topic.category?.name}
              </span>
              {topic.topic_tags?.map((topicTag: any) => (
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
              {topic.is_pinned && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-700 dark:text-yellow-300 rounded-full shadow-sm ring-1 ring-yellow-500/20">
                  📌 Prikvačeno
                </span>
              )}
              {topic.is_locked && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-sm ring-1 ring-gray-500/20">
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

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight break-words">{topic.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-4">
              <Link href={`/forum/user/${topic.author?.username}`} className="flex-shrink-0 transition-transform hover:scale-110">
                <Avatar
                  src={topic.author?.avatar_url}
                  alt={topic.author?.username || 'User'}
                  username={topic.author?.username}
                  size="md"
                />
              </Link>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Autor:</span>
                  <Link
                    href={`/forum/user/${topic.author?.username}`}
                    className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {topic.author?.username}
                  </Link>
                  {topic.author?.reputation > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-700 dark:text-yellow-300 rounded-full shadow-sm ring-1 ring-yellow-500/20">
                      ⭐ {topic.author.reputation}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{topic.reply_count}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">odgovora</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">{topic.view_count}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">pregleda</span>
              </div>
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
          
          {/* Topic Reactions */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ReactionPicker
              topicId={topic.id}
              reactions={topicReactions || []}
              currentUserId={user?.id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Poll Creator - Only for topic author if no poll exists */}
      {isAuthor && !pollDetails && !topic.is_locked && (
        <PollCreator topicId={topic.id} />
      )}

      {/* Poll Widget */}
      {pollDetails && (
        <PollWidget
          poll={(pollDetails as any).poll}
          options={(pollDetails as any).options}
          totalVotes={(pollDetails as any).totalVotes}
          userVotes={(pollDetails as any).userVotes}
          currentUserId={user?.id}
        />
      )}

      {/* Typing Indicator */}
      {user && !topic.is_locked && (
        <TypingIndicator
          topicId={topic.id}
          currentUserId={user.id}
          currentUsername={userProfile?.username}
        />
      )}

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
