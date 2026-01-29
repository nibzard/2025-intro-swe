import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/forum/bookmark-button';
import { Breadcrumb } from '@/components/forum/breadcrumb';
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

  // Get user's bookmarks
  const { data: bookmarkData, error: bookmarkError } = await (supabase as any)
    .from('bookmarks')
    .select('id, created_at, topic_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (bookmarkError) {
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
            <p className="text-red-600 text-sm">
              Došlo je do greške prilikom učitavanja vaših oznaka. Molimo pokušajte ponovno kasnije.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initialize bookmarks array
  let bookmarks: any[] = [];

  // If we have bookmark data, fetch the related topics
  if (bookmarkData && bookmarkData.length > 0) {
    // Get topic IDs
    const topicIds = bookmarkData.map((b: any) => b.topic_id);

    // Fetch topics with their relations
    const { data: topicsData } = await (supabase as any)
      .from('topics')
      .select(`
        id,
        title,
        slug,
        created_at,
        reply_count,
        view_count,
        has_solution,
        author:profiles!topics_author_id_fkey(username, avatar_url),
        category:categories(name, slug, color)
      `)
      .in('id', topicIds);

    // Combine bookmarks with topics
    bookmarks = bookmarkData.map((bookmark: any) => ({
      ...bookmark,
      topics: topicsData?.find((topic: any) => topic.id === bookmark.topic_id)
    })).filter((bookmark: any) => bookmark.topics); // Only keep bookmarks with valid topics
  }

  // Count valid bookmarks
  const validBookmarksCount = bookmarks.length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Forum', href: '/forum' },
          { label: 'Moje oznake' },
        ]}
      />

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moje oznake</h1>
          <p className="text-sm text-gray-500">
            {validBookmarksCount} {validBookmarksCount === 1 ? 'spremljena tema' : 'spremljenih tema'}
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
                        {bookmark.topics.category && (
                          <span
                            className="px-2 py-0.5 text-xs font-semibold rounded"
                            style={{
                              backgroundColor: bookmark.topics.category.color + '20',
                              color: bookmark.topics.category.color,
                            }}
                          >
                            {bookmark.topics.category.name}
                          </span>
                        )}
                        {bookmark.topics.has_solution && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Rijeseno
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/forum/topic/${bookmark.topics.slug}`}
                        className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors block line-clamp-2"
                      >
                        {bookmark.topics.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-2">
                        {bookmark.topics.author?.username && (
                          <span>od {bookmark.topics.author.username}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {bookmark.topics.reply_count || 0}
                        </span>
                        <span>{bookmark.topics.view_count || 0} pregleda</span>
                      </div>
                    </div>
                    <BookmarkButton
                      topicId={bookmark.topics.id}
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
