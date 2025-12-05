'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Search, Settings, User, LogOut, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';

interface MobileNavProps {
  user: any;
  profile: any;
}

export function MobileNav({ user, profile }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-14 right-0 w-64 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 overflow-y-auto">
            <div className="p-4 space-y-4">
              {user && profile ? (
                <>
                  {/* User Info */}
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <Link
                      href={`/forum/user/${profile.username}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {profile.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          Pogledaj profil
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <Link
                      href="/forum/new"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Nova tema
                    </Link>

                    <Link
                      href="/forum"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      Forum
                    </Link>

                    <Link
                      href="/forum/users"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      Korisnici
                    </Link>

                    <Link
                      href="/forum/search"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Pretraži
                    </Link>

                    {profile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        Admin
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        Odjavi se
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  {/* Guest Navigation */}
                  <div className="space-y-3">
                    <Link
                      href="/forum"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      Forum
                    </Link>

                    <Link
                      href="/forum/users"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      Korisnici
                    </Link>

                    <Link
                      href="/forum/search"
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Pretraži
                    </Link>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                      <Link href="/auth/login" onClick={closeMenu} className="block">
                        <Button variant="outline" className="w-full">
                          Prijava
                        </Button>
                      </Link>
                      <Link href="/auth/register" onClick={closeMenu} className="block">
                        <Button className="w-full">
                          Registracija
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
