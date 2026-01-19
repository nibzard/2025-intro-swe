import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileEditForm } from './profile-edit-form';

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get profile being edited
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Check if user is editing their own profile
  if (profile.id !== user.id) {
    redirect(`/forum/user/${username}`);
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-5 sm:pt-6">
          <CardTitle className="text-xl sm:text-2xl">Uredi Profil</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
          <ProfileEditForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
