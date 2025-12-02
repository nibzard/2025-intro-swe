'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Category, Topic } from '@/lib/types';
import { CategorySkeleton, TopicSkeleton } from '@/components/LoadingSkeleton';

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesData) {
      setCategories(categoriesData as Category[]);
    }

    // Fetch recent topics with author and category info
    const { data: topicsData } = await supabase
      .from('topics')
      .select(`
        *,
        author:profiles!topics_author_id_fkey(id, full_name),
        category:categories!topics_category_id_fkey(id, name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (topicsData) {
      setRecentTopics(topicsData as Topic[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
            <div className="mt-16 space-y-4">
              {[1, 2, 3].map((i) => (
                <TopicSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 gradient-text tracking-tight">
              Kategorije
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Odaberi kategoriju i započni diskusiju sa zajednicom
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/forum/category/${category.slug}`}
                className="card-modern group p-8 animate-slide-up relative overflow-hidden"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-[var(--muted)] leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Topics Section */}
          <div className="mt-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-extrabold gradient-text mb-2">Nedavne teme</h2>
                <p className="text-[var(--muted)]">Najnovije diskusije u zajednici</p>
              </div>
              <Link
                href="/forum/new"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl transition-all hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                + Nova tema
              </Link>
            </div>

        {recentTopics.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              Nema tema. Budi prvi i kreiraj novu temu!
            </p>
            <Link
              href="/forum/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all hover:scale-105 shadow-md hover:shadow-lg font-medium"
            >
              Kreiraj prvu temu
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {recentTopics.map((topic, index) => (
              <Link
                key={topic.id}
                href={`/forum/topic/${topic.id}`}
                className="block card-modern p-7 group animate-slide-up relative overflow-hidden"
                style={{animationDelay: `${index * 0.03}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-3 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                      {topic.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{topic.author?.full_name || 'Anonimno'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                          {topic.category?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(topic.created_at).toLocaleDateString('hr-HR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background)] rounded-xl whitespace-nowrap">
                    <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-semibold text-[var(--foreground)]">{topic.view_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    </>
  );
}
