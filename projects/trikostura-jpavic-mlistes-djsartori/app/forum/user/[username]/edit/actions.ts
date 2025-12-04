'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { profileUpdateSchema } from '@/lib/validations/profile';

export async function updateProfile(formData: FormData) {
  const supabase: any = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  // Parse and validate form data
  const full_name = formData.get('full_name') as string;
  const bio = formData.get('bio') as string;
  const university = formData.get('university') as string;
  const study_program = formData.get('study_program') as string;

  const rawData = {
    full_name: full_name || '',
    bio: bio && bio.trim() !== '' ? bio : undefined,
    university: university && university.trim() !== '' ? university : undefined,
    study_program: study_program && study_program.trim() !== '' ? study_program : undefined,
  };

  const validationResult = profileUpdateSchema.safeParse(rawData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors?.[0]?.message || 'Nevažeći podaci';
    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = validationResult.data;

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      bio: data.bio ?? null,
      university: data.university ?? null,
      study_program: data.study_program ?? null,
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Get username for redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  revalidatePath(`/forum/user/${profile.username}`);
  redirect(`/forum/user/${profile.username}`);
}
