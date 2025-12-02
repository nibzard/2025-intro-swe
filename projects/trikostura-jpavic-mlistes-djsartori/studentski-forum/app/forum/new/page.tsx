'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Category } from '@/lib/types';

export default function NewTopicPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) {
      setCategories(data as Category[]);
      if (data.length > 0) {
        setCategoryId(data[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSubmitting(true);

    if (!title.trim() || !content.trim() || !categoryId) {
      setError('Sva polja su obavezna');
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from('topics')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        category_id: categoryId,
      })
      .select()
      .single();

    if (error) {
      setError('Greška pri kreiranju teme');
      setSubmitting(false);
    } else if (data) {
      router.push(`/forum/topic/${data.id}`);
    }
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Učitavanje...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link
              href="/forum"
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Nazad na forum
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8 animate-fade-in">
            <div className="mb-8">
              <h1 className="text-4xl font-bold gradient-text">Kreiraj novu temu</h1>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Kategorija
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 transition-all"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Naslov teme
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 transition-all"
              placeholder="Upiši naslov teme..."
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Sadržaj
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Opiši svoju temu..."
            />
          </div>

          <div className="flex gap-4 pt-4">
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
                  Kreiranje...
                </>
              ) : (
                'Kreiraj temu'
              )}
            </button>
            <Link
              href="/forum"
              className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all"
            >
              Odustani
            </Link>
          </div>
        </form>
          </div>
        </div>
      </div>
    </>
  );
}
