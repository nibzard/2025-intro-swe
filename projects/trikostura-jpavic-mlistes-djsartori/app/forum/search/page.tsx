'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { sanitizeSearchQuery } from '@/lib/utils/sanitize';
import { Breadcrumb } from '@/components/forum/breadcrumb';
import {
  Search,
  MessageSquare,
  Filter,
  X,
  ChevronDown,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  BookOpen,
  Lightbulb,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
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

const RECENT_SEARCHES_KEY = 'forum_recent_searches';
const MAX_RECENT_SEARCHES = 5;

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

  // Autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  // View options
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Categories list
  const [categories, setCategories] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({ totalTopics: 0, totalReplies: 0, totalUsers: 0 });

  // Trending topics
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus search with / or Ctrl+K / Cmd+K
      if (
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load categories, stats, and trending topics on mount
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .order('order_index', { ascending: true });
      setCategories(categoriesData || []);

      // Load stats
      const { count: topicsCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });

      const { count: repliesCount } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true });

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalTopics: topicsCount || 0,
        totalReplies: repliesCount || 0,
        totalUsers: usersCount || 0,
      });

      // Load trending topics (most replies in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: trending } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          slug,
          reply_count,
          view_count,
          category:categories(name, color)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('reply_count', { ascending: false })
        .limit(5);

      setTrendingTopics(trending || []);
    }

    loadData();

    // Load recent searches from localStorage
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...recentSearches.filter(s => s !== trimmed)
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    saveRecentSearch(query);

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

  // Autocomplete suggestions with debouncing
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const sanitizedQuery = sanitizeSearchQuery(query);

        if (!sanitizedQuery) {
          setSuggestions([]);
          return;
        }

        const { data: topics } = await supabase
          .from('topics')
          .select('id, title, slug, category:categories(name, color)')
          .ilike('title', `%${sanitizedQuery}%`)
          .limit(5);

        setSuggestions(topics || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

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

  // Handle keyboard navigation for autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedSuggestion >= 0) {
          e.preventDefault();
          const suggestion = suggestions[selectedSuggestion];
          setQuery(suggestion.title);
          setShowSuggestions(false);
          setSelectedSuggestion(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
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
          Pretraži {stats.totalTopics.toLocaleString()} tema i {stats.totalReplies.toLocaleString()} odgovora
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Upiši pojam za pretragu... (ili pritisni '/' ili Ctrl+K)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedSuggestion(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10"
                  disabled={isSearching}
                  autoComplete="off"
                />

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                          index === selectedSuggestion
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => {
                          setQuery(suggestion.title);
                          setShowSuggestions(false);
                          setSelectedSuggestion(-1);
                        }}
                      >
                        <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {suggestion.title}
                        </div>
                        {suggestion.category && (
                          <span
                            className="inline-block mt-1 px-2 py-0.5 text-xs rounded"
                            style={{
                              backgroundColor: suggestion.category.color + '20',
                              color: suggestion.category.color,
                            }}
                          >
                            {suggestion.category.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              <Button type="submit" disabled={isSearching || !query.trim()}>
                {isSearching ? 'Pretraživanje...' : 'Pretraži'}
              </Button>
            </div>

            {/* Quick Filters - Always Visible */}
            <div className="flex flex-wrap gap-2">
              <Select value={searchIn} onValueChange={(val: any) => setSearchIn(val)}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve</SelectItem>
                  <SelectItem value="topics">Samo Teme</SelectItem>
                  <SelectItem value="replies">Samo Odgovori</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-auto">
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

              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevantnost</SelectItem>
                  <SelectItem value="date-desc">Najnovije</SelectItem>
                  <SelectItem value="date-asc">Najstarije</SelectItem>
                  <SelectItem value="replies">Broj odgovora</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Obriši filtere
                </Button>
              )}
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-gray-500 py-1">Aktivni filteri:</span>

                {selectedCategories.map((catId) => {
                  const category = categories.find(c => c.id === catId);
                  return category ? (
                    <Badge
                      key={catId}
                      variant="secondary"
                      className="cursor-pointer hover:opacity-70 transition-opacity"
                      style={{
                        backgroundColor: category.color + '30',
                        borderColor: category.color,
                        color: category.color,
                      }}
                      onClick={() => toggleCategory(catId)}
                    >
                      {category.name}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ) : null;
                })}

                {dateRange !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setDateRange('all')}
                  >
                    Datum: {
                      dateRange === 'day' ? 'Zadnji dan' :
                      dateRange === 'week' ? 'Zadnji tjedan' :
                      dateRange === 'month' ? 'Zadnji mjesec' :
                      'Zadnja godina'
                    }
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}

                {authorFilter.trim() && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setAuthorFilter('')}
                  >
                    Autor: {authorFilter}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}

                {sortBy !== 'relevance' && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setSortBy('relevance')}
                  >
                    Sortiranje: {
                      sortBy === 'date-desc' ? 'Najnovije' :
                      sortBy === 'date-asc' ? 'Najstarije' :
                      'Broj odgovora'
                    }
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}

                {searchIn !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setSearchIn('all')}
                  >
                    Pretraži u: {searchIn === 'topics' ? 'Samo Teme' : 'Samo Odgovori'}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Author Filter */}
                  <div>
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
                        className="cursor-pointer hover:opacity-80 transition-opacity"
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
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {results.length}
                  </span>{' '}
                  {results.length === 1 ? 'rezultat' : 'rezultata'}
                  {searchIn === 'all' && (
                    <span className="ml-2">
                      ({results.filter((r) => r.type === 'topic').length} tema,{' '}
                      {results.filter((r) => r.type === 'reply').length} odgovora)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Prikaz:</span>
                  <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title="Prikaz liste"
                    >
                      <LayoutList className="w-4 h-4" />
                      <span className="text-sm">Lista</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors border-l border-gray-300 dark:border-gray-600 ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title="Prikaz mreže"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="text-sm">Mreža</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                {results.map((result) => (
                  <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
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
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nema rezultata</h3>
                  <p className="text-gray-500 mb-4">
                    Pokušaj s drugačijim pojmom za pretragu ili promijeni filtere
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setHasSearched(false);
                      clearFilters();
                    }}
                  >
                    Nova pretraga
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State - Show helpful content */}
      {!hasSearched && (
        <div className="space-y-6">
          {/* Top Row: Search Tips and Trending Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Tips */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Savjeti za pretraživanje</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Jednostavna pretraga:</span>
                    <p className="mt-1">Upiši bilo koji pojam, npr. "matematika", "programiranje", "ispit"</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Više riječi:</span>
                    <p className="mt-1">Traži teme koje sadrže sve navedene riječi, npr. "web development tutorial"</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Koristi filtere:</span>
                    <p className="mt-1">Suzite rezultate po kategoriji, datumu, autoru ili vrsti sadržaja</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Primjeri pretraga:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Python tutorial', 'React hooks', 'SQL query', 'Machine learning'].map((example) => (
                        <Badge
                          key={example}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => {
                            setQuery(example);
                            handleSearch();
                          }}
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Popularne Teme</h3>
                </div>
                <div className="space-y-3">
                  {trendingTopics.length > 0 ? (
                    trendingTopics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/forum/topic/${topic.slug}`}
                        className="block group"
                      >
                        <div className="text-sm font-medium group-hover:text-blue-600 transition-colors line-clamp-2">
                          {topic.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {topic.category && (
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: topic.category.color + '20',
                                color: topic.category.color,
                              }}
                            >
                              {topic.category.name}
                            </span>
                          )}
                          <span>{topic.reply_count} odgovora</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nema popularnih tema</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Recent Searches and Stats side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">Nedavne Pretrage</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Obriši sve nedavne pretrage"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-colors"
                        onClick={() => {
                          setQuery(search);
                          handleSearch();
                        }}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Card - Always visible, takes remaining space */}
            <Card className={recentSearches.length > 0 ? '' : 'lg:col-span-3'}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">Statistika</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Teme</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{stats.totalTopics.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Odgovori</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats.totalReplies.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Korisnici</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{stats.totalUsers.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
