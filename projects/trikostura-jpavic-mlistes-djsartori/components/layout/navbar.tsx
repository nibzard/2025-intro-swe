import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { logout } from '@/app/auth/actions';
import { MessageSquare, User, LogOut, Search, Settings } from 'lucide-react';
import type { Notification } from '@/types/notifications';

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;
  let notifications: Notification[] = [];
  let unreadCount = 0;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    // Fetch notifications
    const { data: notificationData } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id(username, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notificationData) {
      notifications = notificationData as Notification[];
      unreadCount = notificationData.filter((n: any) => !n.is_read).length;
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and main navigation */}
          <div className="flex items-center gap-8">
            <Link href="/forum" className="group flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-200">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Studentski Forum
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/forum">
                <Button
                  variant="ghost"
                  className="font-semibold text-base hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  Forum
                </Button>
              </Link>
              <Link href="/forum/search">
                <Button
                  variant="ghost"
                  className="font-semibold text-base hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Pretraži
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    className="font-semibold text-base hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl px-4 py-2 transition-all duration-200"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                <Link href="/forum/new">
                  <Button className="font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-6 py-2">
                    Nova tema
                  </Button>
                </Link>
                <NotificationBell
                  initialNotifications={notifications}
                  initialUnreadCount={unreadCount}
                />
                <Link
                  href={`/forum/user/${profile.username}`}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline">{profile.username}</span>
                </Link>
                <form action={logout}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl p-2.5 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="font-semibold border-2 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl px-6 py-2 transition-all duration-200"
                  >
                    Prijava
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-6 py-2">
                    Registracija
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
