import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReplyForm } from '@/components/forum/reply-form';
import { ReplyCard } from '@/components/forum/reply-card';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
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
  const { data: topic } = await supabase
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
      row_id: (topic as any).id,
      column_name: 'view_count',
    });
  } catch (error) {
    // Fallback if function doesn't exist
    await (supabase as any)
      .from('topics')
      .update({ view_count: (topic as any).view_count + 1 })
      .eq('id', (topic as any).id);
  }

  // Get replies with user vote info
  const { data: replies } = await supabase
    .from('replies')
    .select(`
      *,
      author:profiles!replies_author_id_fkey(username, avatar_url, reputation)
    `)
    .eq('topic_id', (topic as any).id)
    .order('created_at', { ascending: true });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/forum/category/${(topic as any).category?.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na {(topic as any).category?.name}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 text-sm font-semibold rounded-full"
              style={{
                backgroundColor: (topic as any).category?.color + '20',
                color: (topic as any).category?.color,
              }}
            >
              {(topic as any).category?.icon} {(topic as any).category?.name}
            </span>
            {(topic as any).is_pinned && (
              <span className="text-yellow-500">📌 Prikvačeno</span>
            )}
            {(topic as any).is_locked && (
              <span className="text-gray-500">🔒 Zaključano</span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{(topic as any).title}</h1>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-4">
              <span>
                Autor: <strong>{(topic as any).author?.username}</strong>
              </span>
              <span>{new Date((topic as any).created_at).toLocaleDateString('hr-HR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {(topic as any).reply_count} odgovora
              </span>
              <span>{(topic as any).view_count} pregleda</span>
            </div>
          </div>

          <MarkdownRenderer content={(topic as any).content} />
        </CardContent>
      </Card>

      {replies && replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Odgovori ({replies.length})
          </h2>
          {replies.map((reply: any) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              userVote={userVotes[reply.id]}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      )}

      {user && !(topic as any).is_locked ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Dodaj odgovor</h3>
            <ReplyForm topicId={(topic as any).id} />
          </CardContent>
        </Card>
      ) : (topic as any).is_locked ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>Ova tema je zaključana i ne možete dodati nove odgovore.</p>
          </CardContent>
        </Card>
      ) : (
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
