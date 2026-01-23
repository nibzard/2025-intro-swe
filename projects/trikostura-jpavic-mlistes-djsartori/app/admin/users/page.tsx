import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UserManagementClient } from './user-management-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: users } = await supabase
    .from('profiles')
<<<<<<< HEAD
    .select('id, username, email, full_name, avatar_url, role, reputation, is_banned, created_at')
=======
    .select('id, username, email, full_name, avatar_url, role, reputation, is_banned, banned_at, ban_reason, warning_count, last_warning_at, timeout_until, timeout_reason, created_at')
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Upravljanje Korisnicima
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Upravljajte korisničkim ulogama i računima
        </p>
      </div>

      <UserManagementClient users={users || []} />
    </div>
  );
}
