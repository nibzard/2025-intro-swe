import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { MessageSquare, User, LogOut, Search, Settings } from 'lucide-react';

export async function Navbar() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="border-b bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/forum" className="flex items-center gap-2 font-bold text-xl">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <span>Studentski Forum</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/forum"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Forum
              </Link>
              <Link
                href="/forum/search"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Pretraži
              </Link>
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && profile ? (
              <>
                <Link href="/forum/new">
                  <Button size="sm">Nova tema</Button>
                </Link>
                <Link
                  href={`/forum/user/${profile.username}`}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{profile.username}</span>
                </Link>
                <form action={logout}>
                  <Button variant="ghost" size="sm" type="submit">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Prijava
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registracija</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
