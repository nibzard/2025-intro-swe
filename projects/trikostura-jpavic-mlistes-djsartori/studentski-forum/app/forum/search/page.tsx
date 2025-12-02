'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchTopics();
    }
  }, [query]);

  const searchTopics = async () => {
    setLoading(true);

    // Search topics by title or content
    const { data } = await supabase
      .from('topics')
      .select(`
        *,
        author:profiles!topics_author_id_fkey(id, full_name),
        category:categories!topics_category_id_fkey(id, name, slug)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setTopics(data as Topic[]);
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Rezultati pretrage</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Pretraživanje za: <span className="font-semibold">&quot;{query}&quot;</span>
        </p>

        {loading ? (
          <div className="text-center">Učitavanje...</div>
        ) : topics.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            Nema rezultata za &quot;{query}&quot;
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Pronađeno {topics.length} rezultata
            </p>
            <div className="space-y-4">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/forum/topic/${topic.id}`}
                  className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{topic.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                        {topic.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {topic.author?.full_name || 'Anonimno'}
                        </span>
                        <span>
                          {topic.category?.name}
                        </span>
                        <span>
                          {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {topic.view_count} pregleda
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Učitavanje...</div>
        </div>
      </>
    }>
      <SearchResults />
    </Suspense>
  );
}
