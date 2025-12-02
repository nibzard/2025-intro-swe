'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Category, Topic } from '@/lib/types';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch category
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (categoryData) {
      setCategory(categoryData as Category);

      // Fetch topics in this category
      const { data: topicsData } = await supabase
        .from('topics')
        .select(`
          *,
          author:profiles!topics_author_id_fkey(id, full_name)
        `)
        .eq('category_id', categoryData.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (topicsData) {
        setTopics(topicsData as Topic[]);
      }
    }

    setLoading(false);
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

  if (!category) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Kategorija nije pronađena</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/forum"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Nazad na forum
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {category.description}
            </p>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            Nema tema u ovoj kategoriji. Budi prvi i kreiraj novu temu!
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/forum/topic/${topic.id}`}
                className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                      <h3 className="text-lg font-semibold">{topic.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {topic.author?.full_name || 'Anonimno'}
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
        )}
      </div>
    </>
  );
}
