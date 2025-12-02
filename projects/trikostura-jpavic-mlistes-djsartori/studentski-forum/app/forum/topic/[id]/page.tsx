'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/lib/supabase';
import { Topic, Response } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function TopicPage() {
  const params = useParams();
  const topicId = params.id as string;
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchData();
    incrementViewCount();
  }, [topicId]);

  const incrementViewCount = async () => {
    // Increment view count
    const { data: currentTopic } = await supabase
      .from('topics')
      .select('view_count')
      .eq('id', topicId)
      .single();

    if (currentTopic) {
      await supabase
        .from('topics')
        .update({ view_count: (currentTopic.view_count || 0) + 1 })
        .eq('id', topicId);
    }
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch topic
    const { data: topicData } = await supabase
      .from('topics')
      .select(`
        *,
        author:profiles!topics_author_id_fkey(id, full_name, university),
        category:categories!topics_category_id_fkey(id, name, slug)
      `)
      .eq('id', topicId)
      .single();

    if (topicData) {
      const topic = topicData as Topic;

      // Check if user has liked this topic
      if (user) {
        const { data: likeData } = await supabase
          .from('topic_likes')
          .select('id')
          .eq('topic_id', topicId)
          .eq('user_id', user.id)
          .single();

        topic.user_has_liked = !!likeData;
      }

      setTopic(topic);
    }

    // Fetch responses
    const { data: responsesData } = await supabase
      .from('responses')
      .select(`
        *,
        author:profiles!responses_author_id_fkey(id, full_name, university)
      `)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (responsesData) {
      setResponses(responsesData as Response[]);
    }

    setLoading(false);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('responses')
      .insert({
        content: replyContent,
        author_id: user.id,
        topic_id: topicId,
      });

    if (!error) {
      setReplyContent('');
      fetchData();
    }

    setSubmitting(false);
  };

  const handleToggleLike = async () => {
    if (!user || !topic || liking) return;

    setLiking(true);

    if (topic.user_has_liked) {
      // Unlike
      const { error } = await supabase
        .from('topic_likes')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', user.id);

      if (!error) {
        setTopic({
          ...topic,
          like_count: Math.max(0, topic.like_count - 1),
          user_has_liked: false,
        });
      }
    } else {
      // Like
      const { error } = await supabase
        .from('topic_likes')
        .insert({
          topic_id: topicId,
          user_id: user.id,
        });

      if (!error) {
        setTopic({
          ...topic,
          like_count: topic.like_count + 1,
          user_has_liked: true,
        });
      }
    }

    setLiking(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Učitavanje...</div>
        </div>
      </>
    );
  }

  if (!topic) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Tema nije pronađena</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Link
              href={`/forum/category/${topic.category?.slug}`}
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Nazad na {topic.category?.name}
            </Link>
          </div>

          {/* Topic */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 mb-8 shadow-lg animate-fade-in">
          <div className="flex items-start gap-2 mb-4">
            {topic.is_pinned && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded">
                Prikvačeno
              </span>
            )}
            {topic.is_locked && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded">
                Zaključano
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{topic.title}</h1>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar name={topic.author?.full_name || 'Anonimno'} size="md" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {topic.author?.full_name || 'Anonimno'}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {topic.author?.university && <span>{topic.author.university}</span>}
                  <span>•</span>
                  <span>{new Date(topic.created_at).toLocaleString('hr-HR')}</span>
                </div>
              </div>
            </div>

            {/* Like button */}
            {user && (
              <button
                onClick={handleToggleLike}
                disabled={liking}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${topic.user_has_liked
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={topic.user_has_liked ? 'Unlike' : 'Like'}
              >
                <svg
                  className={`w-5 h-5 ${topic.user_has_liked ? 'fill-current' : ''}`}
                  fill={topic.user_has_liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{topic.like_count || 0}</span>
              </button>
            )}
          </div>

          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: topic.content }}
          />
        </div>

        {/* Responses */}
        <div className="space-y-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Odgovori ({responses.length})
            </h2>
          </div>

          {responses.map((response, index) => (
            <div
              key={response.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-600 transition-all animate-slide-up shadow-sm hover:shadow-md"
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={response.author?.full_name || 'Anonimno'} size="sm" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {response.author?.full_name || 'Anonimno'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {response.author?.university && <span>{response.author.university}</span>}
                    {response.author?.university && <span>•</span>}
                    <span>{new Date(response.created_at).toLocaleString('hr-HR')}</span>
                  </div>
                </div>
              </div>

              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: response.content }}
              />
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {user && !topic.is_locked ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dodaj odgovor</h3>
            </div>
            <form onSubmit={handleSubmitReply}>
              <RichTextEditor
                content={replyContent}
                onChange={setReplyContent}
                placeholder="Napiši svoj odgovor..."
              />
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Slanje...
                    </>
                  ) : (
                    'Objavi odgovor'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : !user ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Prijavite se
            </Link>{' '}
            da biste odgovorili na ovu temu.
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            Ova tema je zaključana i ne možete dodati odgovore.
          </div>
        )}
      </div>
    </>
  );
}
