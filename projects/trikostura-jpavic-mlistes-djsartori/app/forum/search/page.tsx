'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { sanitizeSearchQuery } from '@/lib/utils/sanitize';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import { Search, MessageSquare, Filter, X, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

type SearchResult = {
  id: string;
  type: 'topic' | 'reply';
  title?: string;
  content: string;
  slug?: string;
  topic_slug?: string;
  topic_title?: string;
  author: { username: string };
  category?: { name: string; slug: string; color: string };
  reply_count?: number;
  created_at: string;
  is_pinned?: boolean;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date-desc' | 'date-asc' | 'replies'>('relevance');
  const [searchIn, setSearchIn] = useState<'all' | 'topics' | 'replies'>('all');

  // Categories list
  const [categories, setCategories] = useState<any[]>([]);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .order('order_index', { ascending: true });
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const sanitizedQuery = sanitizeSearchQuery(query);

      if (!sanitizedQuery) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      const supabase = createClient();
      const combinedResults: SearchResult[] = [];

      // Calculate date filter
      let dateFilter: Date | null = null;
      if (dateRange !== 'all') {
        const now = new Date();
        switch (dateRange) {
          case 'day':
            dateFilter = new Date(now.setDate(now.getDate() - 1));
            break;
          case 'week':
            dateFilter = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            dateFilter = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
      }

      // Search in topics
      if (searchIn === 'all' || searchIn === 'topics') {
        let topicsQuery = supabase
          .from('topics')
          .select(`
            *,
            author:profiles!topics_author_id_fkey(username),
            category:categories(name, slug, color)
          `)
          .or(`title.ilike.%${sanitizedQuery}%,content.ilike.%${sanitizedQuery}%`);

        // Apply category filter
        if (selectedCategories.length > 0) {
          topicsQuery = topicsQuery.in('category_id', selectedCategories);
        }

        // Apply date filter
        if (dateFilter) {
          topicsQuery = topicsQuery.gte('created_at', dateFilter.toISOString());
        }

        // Apply author filter
        if (authorFilter.trim()) {
          const { data: authorProfiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', `%${sanitizeSearchQuery(authorFilter)}%`)
            .limit(1);

          if (authorProfiles && authorProfiles.length > 0) {
            topicsQuery = topicsQuery.eq('author_id', (authorProfiles[0] as any).id);
          } else {
            topicsQuery = topicsQuery.eq('author_id', '00000000-0000-0000-0000-000000000000');
          }
        }

        topicsQuery = topicsQuery.limit(50);

        const { data: topics } = await topicsQuery;

        if (topics) {
          combinedResults.push(
            ...topics.map((topic: any) => ({
              id: topic.id,
              type: 'topic' as const,
              title: topic.title,
              content: topic.content,
              slug: topic.slug,
              author: topic.author,
              category: topic.category,
              reply_count: topic.reply_count,
              created_at: topic.created_at,
              is_pinned: topic.is_pinned,
            }))
          );
        }
      }

      // Search in replies
      if (searchIn === 'all' || searchIn === 'replies') {
        let repliesQuery = supabase
          .from('replies')
          .select(`
            *,
            author:profiles!replies_author_id_fkey(username),
            topic:topics!replies_topic_id_fkey(
              title,
              slug,
              category_id,
              category:categories(name, slug, color)
            )
          `)
          .ilike('content', `%${sanitizedQuery}%`);

        // Apply date filter
        if (dateFilter) {
          repliesQuery = repliesQuery.gte('created_at', dateFilter.toISOString());
        }

        // Apply author filter
        if (authorFilter.trim()) {
          const { data: authorProfiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', `%${sanitizeSearchQuery(authorFilter)}%`)
            .limit(1);

          if (authorProfiles && authorProfiles.length > 0) {
            repliesQuery = repliesQuery.eq('author_id', (authorProfiles[0] as any).id);
          } else {
            repliesQuery = repliesQuery.eq('author_id', '00000000-0000-0000-0000-000000000000');
          }
        }

        repliesQuery = repliesQuery.limit(50);

        const { data: replies } = await repliesQuery;

        if (replies) {
          let filteredReplies = replies;

          // Apply category filter to replies
          if (selectedCategories.length > 0) {
            filteredReplies = replies.filter((reply: any) =>
              selectedCategories.includes((reply.topic as any)?.category_id)
            );
          }

          combinedResults.push(
            ...filteredReplies.map((reply: any) => ({
              id: reply.id,
              type: 'reply' as const,
              content: reply.content,
              topic_slug: (reply.topic as any)?.slug,
              topic_title: (reply.topic as any)?.title,
              author: reply.author,
              category: (reply.topic as any)?.category,
              created_at: reply.created_at,
            }))
          );
        }
      }

      // Sort results
      combinedResults.sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'date-asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'replies':
            return (b.reply_count || 0) - (a.reply_count || 0);
          case 'relevance':
          default:
            return 0;
        }
      });

      setResults(combinedResults.slice(0, 50));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  // Re-run search when filters change
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [selectedCategories, dateRange, authorFilter, sortBy, searchIn]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDateRange('all');
    setAuthorFilter('');
    setSortBy('relevance');
    setSearchIn('all');
  };

  const activeFilterCount =
    selectedCategories.length +
    (dateRange !== 'all' ? 1 : 0) +
    (authorFilter.trim() ? 1 : 0) +
    (sortBy !== 'relevance' ? 1 : 0) +
    (searchIn !== 'all' ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Forum', href: '/forum' },
          { label: 'Pretraga' },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold mb-2">Napredna Pretraga Foruma</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pretraži teme i odgovore s naprednim filterima
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filteri
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </Button>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? 'Pretraživanje...' : 'Pretraži'}
              </Button>
            </div>

            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search In */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Pretraži u</label>
                    <Select value={searchIn} onValueChange={(val: any) => setSearchIn(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sve (Teme i Odgovori)</SelectItem>
                        <SelectItem value="topics">Samo Teme</SelectItem>
                        <SelectItem value="replies">Samo Odgovori</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Datum</label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Bilo kada</SelectItem>
                        <SelectItem value="day">Zadnji dan</SelectItem>
                        <SelectItem value="week">Zadnji tjedan</SelectItem>
                        <SelectItem value="month">Zadnji mjesec</SelectItem>
                        <SelectItem value="year">Zadnja godina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sortiraj po</label>
                    <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevantnosti</SelectItem>
                        <SelectItem value="date-desc">Najnovije</SelectItem>
                        <SelectItem value="date-asc">Najstarije</SelectItem>
                        <SelectItem value="replies">Broj odgovora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Author Filter */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">Autor</label>
                    <Input
                      type="text"
                      placeholder="Filtriraj po korisničkom imenu..."
                      value={authorFilter}
                      onChange={(e) => setAuthorFilter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Kategorije</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={
                          selectedCategories.includes(category.id)
                            ? { backgroundColor: category.color, borderColor: category.color }
                            : { borderColor: category.color, color: category.color }
                        }
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Obriši filtere
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pronađeno {results.length} {results.length === 1 ? 'rezultat' : 'rezultata'}
                  {searchIn === 'all' && (
                    <span className="ml-2">
                      ({results.filter((r) => r.type === 'topic').length} tema,{' '}
                      {results.filter((r) => r.type === 'reply').length} odgovora)
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {results.map((result) => (
                  <Card key={`${result.type}-${result.id}`} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {result.type === 'topic' ? 'Tema' : 'Odgovor'}
                            </Badge>
                            {result.category && (
                              <span
                                className="px-2 py-1 text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: result.category.color + '20',
                                  color: result.category.color,
                                }}
                              >
                                {result.category.name}
                              </span>
                            )}
                            {result.is_pinned && (
                              <span className="text-yellow-500 text-sm">📌</span>
                            )}
                          </div>

                          {result.type === 'topic' ? (
                            <>
                              <Link
                                href={`/forum/topic/${result.slug}`}
                                className="text-xl font-semibold hover:text-blue-600 transition-colors block"
                              >
                                {result.title}
                              </Link>
                              <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {result.content}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                                <span>od {result.author?.username}</span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  {result.reply_count} odgovora
                                </span>
                                <span>
                                  {new Date(result.created_at).toLocaleDateString('hr-HR')}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm text-gray-500 mb-2">
                                Odgovor u:{' '}
                                <Link
                                  href={`/forum/topic/${result.topic_slug}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {result.topic_title}
                                </Link>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                                {result.content}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                                <span>od {result.author?.username}</span>
                                <span>
                                  {new Date(result.created_at).toLocaleDateString('hr-HR')}
                                </span>
                              </div>
                            </>
                          )}
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
                  Pokušaj s drugačijim pojmom za pretragu ili promijeni filtere
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
            <h3 className="text-lg font-semibold mb-2">Započni naprednu pretragu</h3>
            <p className="text-gray-500">
              Upiši pojam u polje iznad i koristi filtere za preciznije rezultate
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
