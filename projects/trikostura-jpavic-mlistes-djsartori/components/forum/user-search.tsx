'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Star, MessageSquare, FileText } from 'lucide-react';

interface UserSearchProps {
  users: any[];
}

export function UserSearch({ users }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'reputation' | 'activity'>('username');

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return b.reputation - a.reputation;
        case 'activity':
          return b.total_activity - a.total_activity;
        case 'username':
        default:
          return a.username.localeCompare(b.username);
      }
    });

    return filtered;
  }, [users, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Pretraži korisnike..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={sortBy === 'username' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('username')}
            className="flex-shrink-0"
          >
            Abecedno
          </Button>
          <Button
            variant={sortBy === 'reputation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('reputation')}
            className="flex-shrink-0"
          >
            Reputacija
          </Button>
          <Button
            variant={sortBy === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('activity')}
            className="flex-shrink-0"
          >
            Aktivnost
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        Pronađeno: {filteredAndSortedUsers.length} korisnik(a)
      </p>

      {/* User List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAndSortedUsers.map((user) => (
          <Link
            key={user.id}
            href={`/forum/user/${user.username}`}
            className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-base font-semibold truncate">
                  {user.username}
                </p>
                {user.role === 'admin' && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              {user.full_name && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.full_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  {user.reputation}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {user.topic_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {user.reply_count}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500">
            Nema korisnika koji odgovaraju pretrazi
          </p>
        </div>
      )}
    </div>
  );
}
