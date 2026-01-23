import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
<<<<<<< HEAD
=======
import { AdminErrorBoundary } from './admin-error-boundary';
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FolderOpen,
  Settings,
  BarChart3,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).role !== 'admin') {
    redirect('/forum');
  }

  const navItems = [
    {
      name: 'Nadzorna Ploča',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Korisnici',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Teme',
      href: '/admin/topics',
      icon: MessageSquare,
    },
    {
      name: 'Odgovori',
      href: '/admin/replies',
      icon: MessageSquare,
    },
    {
      name: 'Kategorije',
      href: '/admin/categories',
      icon: FolderOpen,
    },
    {
      name: 'Analitika',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 bottom-0 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
              <SkriptaLogo size={32} />
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent font-semibold">
                  Skripta
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/forum"
                className="flex items-center gap-3 px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Natrag na Forum</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 flex items-center px-4">
          <SkriptaLogo size={24} className="mr-2" />
          <h1 className="text-lg font-bold">Admin</h1>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
          <nav className="flex justify-around items-center h-full px-2">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1 text-gray-700 dark:text-gray-300"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-14 pb-16 lg:pt-0 lg:pb-0">
<<<<<<< HEAD
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
=======
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <AdminErrorBoundary>
              {children}
            </AdminErrorBoundary>
          </div>
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
        </main>
      </div>
    </div>
  );
}
