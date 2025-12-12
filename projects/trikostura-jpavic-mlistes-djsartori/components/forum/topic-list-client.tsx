'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface Topic {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  reply_count: number;
  view_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  has_solution: boolean;
  author: {
    username: string;
    avatar_url?: string;
  };
  category: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface TopicListClientProps {
  topics: Topic[];
  totalCount: number;
  solvedCount: number;
  unsolvedCount: number;
}

export function TopicListClient({ topics, totalCount, solvedCount, unsolvedCount }: TopicListClientProps) {
  const [currentFilter, setCurrentFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  // Filter topics based on current filter (client-side = instant!)
  const filteredTopics = useMemo(() => {
    if (currentFilter === 'solved') {
      return topics.filter(topic => topic.has_solution === true);
    } else if (currentFilter === 'unsolved') {
      return topics.filter(topic => !topic.has_solution);
    }
    return topics;
  }, [topics, currentFilter]);

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setCurrentFilter('all')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentFilter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Sve ({totalCount})
        </button>
        <button
          onClick={() => setCurrentFilter('unsolved')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentFilter === 'unsolved'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Neriješeno ({unsolvedCount})
        </button>
        <button
          onClick={() => setCurrentFilter('solved')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentFilter === 'solved'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Riješeno ({solvedCount})
        </button>
      </div>

      {/* Topic List */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <Link href={`/forum/user/${topic.author?.username}`} className="flex-shrink-0">
                <Avatar
                  src={topic.author?.avatar_url}
                  alt={topic.author?.username || 'User'}
                  username={topic.author?.username}
                  size="md"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Link
                    href={`/forum/category/${topic.category?.slug}`}
                    className="px-3 py-1 text-sm font-semibold rounded-full hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: topic.category?.color + '20',
                      color: topic.category?.color,
                    }}
                  >
                    {topic.category?.icon} {topic.category?.name}
                  </Link>
                  {topic.has_solution && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Riješeno
                    </span>
                  )}
                  {topic.is_pinned && (
                    <span className="text-yellow-500 text-sm">📌</span>
                  )}
                  {topic.is_locked && (
                    <span className="text-gray-500 text-sm">🔒</span>
                  )}
                </div>

                <Link
                  href={`/forum/topic/${topic.slug}`}
                  className="block mb-2 group"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                    {topic.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                  <span>
                    od{' '}
                    <Link
                      href={`/forum/user/${topic.author?.username}`}
                      className="font-semibold hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {topic.author?.username}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {topic.reply_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {topic.view_count}
                  </span>
                  <span className="text-xs">
                    {new Date(topic.created_at).toLocaleDateString('hr-HR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Nema tema za prikaz
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
