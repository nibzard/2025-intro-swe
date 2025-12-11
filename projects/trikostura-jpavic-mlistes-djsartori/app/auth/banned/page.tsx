import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';

export const metadata = {
  title: 'Racun suspendiran | Skripta',
};

export default async function BannedPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get profile to check ban status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, ban_reason, banned_at')
    .eq('id', user.id)
    .single();

  // If not banned, redirect to forum
  if (!profile || !(profile as any).is_banned) {
    redirect('/forum');
  }

  const banReason = (profile as any).ban_reason;
  const bannedAt = (profile as any).banned_at
    ? new Date((profile as any).banned_at).toLocaleDateString('hr-HR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            Racun suspendiran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Vas racun je suspendiran i ne mozete pristupiti forumu.
          </p>

          {banReason && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Razlog suspenzije:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {banReason}
              </p>
            </div>
          )}

          {bannedAt && (
            <p className="text-center text-sm text-gray-500">
              Suspendirano: {bannedAt}
            </p>
          )}

          <div className="pt-4 space-y-3">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Ako smatrate da je ovo greska, kontaktirajte administratora.
            </p>

            <form action={logout} className="flex justify-center">
              <Button type="submit" variant="outline" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Odjavi se
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
