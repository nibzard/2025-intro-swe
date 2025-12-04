'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Search, MessageSquare } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const supabase = createClient();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search in topics
      const { data: topics } = await (supabase as any)
        .from('topics')
        .select(`
          *,
          author:profiles!topics_author_id_fkey(username),
          category:categories(name, slug, color)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      setResults(topics || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pretraži Forum</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pretraži teme po naslovu ili sadržaju
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Upiši pojam za pretragu..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Pretraživanje...' : 'Pretraži'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pronađeno {results.length} {results.length === 1 ? 'rezultat' : 'rezultata'}
              </div>
              <div className="space-y-3">
                {results.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="px-2 py-1 text-xs font-semibold rounded"
                              style={{
                                backgroundColor: topic.category?.color + '20',
                                color: topic.category?.color,
                              }}
                            >
                              {topic.category?.name}
                            </span>
                            {topic.is_pinned && (
                              <span className="text-yellow-500 text-sm">📌</span>
                            )}
                          </div>
                          <Link
                            href={`/forum/topic/${topic.slug}`}
                            className="text-xl font-semibold hover:text-blue-600 transition-colors block"
                          >
                            {topic.title}
                          </Link>
                          <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {topic.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                            <span>od {topic.author?.username}</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {topic.reply_count} odgovora
                            </span>
                            <span>
                              {new Date(topic.created_at).toLocaleDateString('hr-HR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nema rezultata</h3>
                <p className="text-gray-500">
                  Pokušaj s drugačijim pojmom za pretragu
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!hasSearched && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Započni pretragu</h3>
            <p className="text-gray-500">
              Upiši pojam u polje iznad i pritisni Enter ili klikni Pretraži
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
