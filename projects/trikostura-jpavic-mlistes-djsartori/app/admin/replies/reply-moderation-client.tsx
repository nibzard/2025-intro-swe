'use client';

import { useState } from 'react';
import { Trash2, Search, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { deleteReply } from '../actions';

type Reply = {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    username: string;
    full_name: string | null;
  } | null;
  topic: {
    title: string;
    slug: string;
  } | null;
};

export function ReplyModerationClient({ replies }: { replies: Reply[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredReplies = replies.filter(
    (reply) =>
      reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.author?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.topic?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (replyId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this reply? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(replyId);
    const result = await deleteReply(replyId);
    setLoading(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search replies by content, author, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Replies List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredReplies.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No replies found
          </div>
        ) : (
          filteredReplies.map((reply) => (
            <div
              key={reply.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {reply.author?.full_name || reply.author?.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      @{reply.author?.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      •
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                    {reply.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    {reply.topic && (
                      <Link
                        href={`/forum/topic/${reply.topic.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View topic: {reply.topic.title}
                      </Link>
                    )}
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {reply.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4" />
                        {reply.downvotes}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(reply.id)}
                  disabled={loading === reply.id}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
