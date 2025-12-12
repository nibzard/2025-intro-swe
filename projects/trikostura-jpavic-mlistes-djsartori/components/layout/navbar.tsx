import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NavbarBookmarkButton } from './navbar-bookmark-button';
import { MobileNav } from './mobile-nav';
import { NavLink } from './nav-link';
import { logout } from '@/app/auth/actions';
import { MessageSquare, User, LogOut, Search, Settings, Bookmark, Mail } from 'lucide-react';
import type { Notification } from '@/types/notifications';
import type { Profile } from '@/types/database';

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let notifications: Notification[] = [];
  let unreadCount = 0;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data as Profile | null;

    // Fetch notifications
    const { data: notificationData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notificationData) {
      // Get unique actor IDs
      const actorIds = [...new Set(notificationData.map((n: any) => n.actor_id).filter(Boolean))];

      // Fetch actors separately
      const { data: actorsData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds);

      // Create a map for quick lookup
      const actorsMap = new Map((actorsData || []).map((a: any) => [a.id, a]));

      // Combine notifications with actor data
      notifications = notificationData.map((n: any) => ({
        ...n,
        actor: n.actor_id ? actorsMap.get(n.actor_id) : null,
      })) as Notification[];

      unreadCount = notifications.filter((n) => !n.is_read).length;
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/forum" className="flex items-center gap-2 font-bold text-lg sm:text-xl hover:opacity-80 transition-opacity">
              <SkriptaLogo size={28} className="sm:w-8 sm:h-8" />
              <span className="hidden xs:inline bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                Skripta
              </span>
              <span className="xs:hidden bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                Skripta
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              <NavLink
                href="/forum"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Forum
              </NavLink>
              <NavLink
                href="/forum/users"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Korisnici
              </NavLink>
              <NavLink
                href="/forum/search"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Pretraži
              </NavLink>
              {profile?.role === 'admin' && (
                <NavLink
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {user && profile ? (
              <>
                <Link href="/forum/new">
                  <Button variant="gradient" size="sm">Nova tema</Button>
                </Link>
                <NavbarBookmarkButton />
                <Link href="/messages" title="Poruke">
                  <Button variant="ghost" size="sm">
                    <Mail className="w-4 h-4" />
                  </Button>
                </Link>
                <NotificationBell
                  initialNotifications={notifications}
                  initialUnreadCount={unreadCount}
                />
                <ThemeToggle />
                <Link
                  href={`/forum/user/${profile.username}`}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Avatar
                    src={profile.avatar_url}
                    alt={profile.username}
                    username={profile.username}
                    size="sm"
                  />
                  <span className="hidden lg:inline">{profile.username}</span>
                </Link>
                <form action={logout}>
                  <Button variant="ghost" size="sm" type="submit" title="Odjavi se" aria-label="Odjavi se">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Prijava
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="gradient" size="sm">Registracija</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {user && profile && (
              <NotificationBell
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
              />
            )}
            <MobileNav user={user} profile={profile} />
          </div>
        </div>
      </div>
    </nav>
  );
}
