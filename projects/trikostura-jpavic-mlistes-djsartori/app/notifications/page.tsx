import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPageClient } from './notification-page-client';

export const metadata = {
  title: 'Obavijesti | Studentski Forum',
  description: 'Tvoje obavijesti',
};

export default async function NotificationsPage() {
  const supabase: any = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch all notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id(username, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Sve obavijesti</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPageClient initialNotifications={notifications || []} />
        </CardContent>
      </Card>
    </div>
  );
}
