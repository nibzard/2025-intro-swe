import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/forum/bookmark-button';
import { Bookmark, MessageSquare, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Moje oznake | Skripta',
  description: 'Spremljene teme',
};

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: bookmarks, error } = await (supabase as any)
    .from('bookmarks')
    .select(`
      id,
      created_at,
      topics!bookmarks_topic_id_fkey(
        id,
        title,
        slug,
        created_at,
        reply_count,
        view_count,
        has_solution,
        author:profiles!topics_author_id_fkey(username, avatar_url),
        category:categories(name, slug, color)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Bookmarks query error:', error);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Greška</h1>
            <p className="text-sm text-red-500">
              Nije moguće učitati oznake
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 font-mono text-sm">
              {error.message || 'Nepoznata greška'}
            </p>
            <p className="text-gray-600 mt-4">
              Molimo pokrenite SQL migraciju: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">supabase/migrations/high_priority_features.sql</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moje oznake</h1>
          <p className="text-sm text-gray-500">
            {bookmarks?.length || 0} {bookmarks?.length === 1 ? 'spremljena tema' : 'spremljenih tema'}
          </p>
        </div>
      </div>

      {bookmarks && bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((bookmark: any) => (
            <Card key={bookmark.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 text-xs font-semibold rounded"
                        style={{
                          backgroundColor: bookmark.topics?.category?.color + '20',
                          color: bookmark.topics?.category?.color,
                        }}
                      >
                        {bookmark.topics?.category?.name}
                      </span>
                      {bookmark.topics?.has_solution && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Rijeseno
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/forum/topic/${bookmark.topics?.slug}`}
                      className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors block line-clamp-2"
                    >
                      {bookmark.topics?.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-2">
                      <span>od {bookmark.topics?.author?.username}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {bookmark.topics?.reply_count}
                      </span>
                      <span>{bookmark.topics?.view_count} pregleda</span>
                    </div>
                  </div>
                  <BookmarkButton
                    topicId={bookmark.topics?.id}
                    initialBookmarked={true}
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              Nemate spremljenih tema. Kliknite na ikonu oznake na bilo kojoj temi da je spremite.
            </p>
            <Link href="/forum">
              <Button>Pregledaj forum</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
