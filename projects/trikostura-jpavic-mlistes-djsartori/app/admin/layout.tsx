import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Topics',
      href: '/admin/topics',
      icon: MessageSquare,
    },
    {
      name: 'Replies',
      href: '/admin/replies',
      icon: MessageSquare,
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderOpen,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 bottom-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Studentski Forum
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/forum"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Forum</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
