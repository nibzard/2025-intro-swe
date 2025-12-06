'use client';

import { useState } from 'react';
import { Pin, Lock, Unlock, Trash2, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { pinTopic, lockTopic, deleteTopic } from '../actions';
import { Avatar } from '@/components/ui/avatar';

type Topic = {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  author: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  category: {
    name: string;
    color: string;
  } | null;
};

export function TopicModerationClient({ topics }: { topics: Topic[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pinned' | 'locked'>('all');

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.author?.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'pinned' && topic.is_pinned) ||
      (filterStatus === 'locked' && topic.is_locked);

    return matchesSearch && matchesFilter;
  });

  const handlePin = async (topicId: string, currentlyPinned: boolean) => {
    setLoading(topicId);
    const result = await pinTopic(topicId, !currentlyPinned);
    setLoading(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleLock = async (topicId: string, currentlyLocked: boolean) => {
    setLoading(topicId);
    const result = await lockTopic(topicId, !currentlyLocked);
    setLoading(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (topicId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This will also delete all replies. This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(topicId);
    const result = await deleteTopic(topicId);
    setLoading(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Filters */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži teme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 h-11 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Sve Teme
          </button>
          <button
            onClick={() => setFilterStatus('pinned')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'pinned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Zakačene
          </button>
          <button
            onClick={() => setFilterStatus('locked')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterStatus === 'locked'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Zaključane
          </button>
        </div>
      </div>

      {/* Topics List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredTopics.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Nema pronađenih tema
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/forum/topic/${topic.slug}`}
                      className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                    >
                      {topic.title}
                    </Link>
                    {topic.is_pinned && (
                      <Pin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                    )}
                    {topic.is_locked && (
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className="inline-block px-2 py-0.5 text-xs rounded"
                      style={{
                        backgroundColor: topic.category?.color + '20',
                        color: topic.category?.color,
                      }}
                    >
                      {topic.category?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={topic.author?.avatar_url}
                        alt={topic.author?.username || 'User'}
                        username={topic.author?.username}
                        size="xs"
                      />
                      <span className="hidden sm:inline">by {topic.author?.username}</span>
                      <span className="sm:hidden">@{topic.author?.username}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {topic.view_count}
                    </span>
                    <span>{topic.reply_count} odgovora</span>
                    <span className="hidden sm:inline">{new Date(topic.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePin(topic.id, topic.is_pinned)}
                    disabled={loading === topic.id}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      topic.is_pinned
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={topic.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  <button
                    onClick={() => handleLock(topic.id, topic.is_locked)}
                    disabled={loading === topic.id}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      topic.is_locked
                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={topic.is_locked ? 'Unlock' : 'Lock'}
                  >
                    {topic.is_locked ? (
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(topic.id, topic.title)}
                    disabled={loading === topic.id}
                    className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
