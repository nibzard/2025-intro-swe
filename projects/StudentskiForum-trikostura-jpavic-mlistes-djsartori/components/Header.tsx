'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/forum/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/forum" className="text-2xl font-bold whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all">
            Studentski Forum
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži forum..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 transition-all"
              />
            </div>
          </form>

          <nav className="flex items-center gap-4">
            <Link
              href="/forum"
              className="hover:text-blue-600 transition-colors"
            >
              Forum
            </Link>

            {user ? (
              <>
                <Link
                  href="/forum/new"
                  className="hover:text-blue-600 transition-colors"
                >
                  Nova tema
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="hover:text-blue-600 transition-colors"
                >
                  {profile?.full_name || 'Profil'}
                </Link>

                <button
                  onClick={handleSignOut}
                  className="px-5 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105 font-medium"
                >
                  Odjava
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 hover:text-purple-600 transition-colors font-medium"
                >
                  Prijava
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all hover:scale-105 shadow-md hover:shadow-lg font-medium"
                >
                  Registracija
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
