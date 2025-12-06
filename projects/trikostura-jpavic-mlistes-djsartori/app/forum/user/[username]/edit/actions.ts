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
  const github_url = formData.get('github_url') as string;
  const linkedin_url = formData.get('linkedin_url') as string;
  const website_url = formData.get('website_url') as string;
  const twitter_url = formData.get('twitter_url') as string;
  const year_of_study = formData.get('year_of_study') as string;
  const graduation_year = formData.get('graduation_year') as string;
  const academic_interests = formData.get('academic_interests') as string;
  const skills = formData.get('skills') as string;
  const profile_color = formData.get('profile_color') as string;
  const avatar_url = formData.get('avatar_url') as string;
  const profile_banner_url = formData.get('profile_banner_url') as string;

  const rawData = {
    full_name: full_name || '',
    bio: bio && bio.trim() !== '' ? bio : undefined,
    university: university && university.trim() !== '' ? university : undefined,
    study_program: study_program && study_program.trim() !== '' ? study_program : undefined,
    github_url: github_url && github_url.trim() !== '' ? github_url : undefined,
    linkedin_url: linkedin_url && linkedin_url.trim() !== '' ? linkedin_url : undefined,
    website_url: website_url && website_url.trim() !== '' ? website_url : undefined,
    twitter_url: twitter_url && twitter_url.trim() !== '' ? twitter_url : undefined,
    year_of_study: year_of_study && year_of_study.trim() !== '' ? year_of_study : undefined,
    graduation_year: graduation_year && graduation_year.trim() !== '' ? graduation_year : undefined,
    academic_interests: academic_interests && academic_interests.trim() !== '' ? academic_interests : undefined,
    skills: skills && skills.trim() !== '' ? skills : undefined,
    profile_color: profile_color || '#3B82F6',
  };

  const validationResult = profileUpdateSchema.safeParse(rawData);

  if (!validationResult.success) {
    const errorMessage = (validationResult.error as any).errors?.[0]?.message || 'Nevažeći podaci';
    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = validationResult.data;

  // Build update object - only include avatar/banner URLs if explicitly provided
  const updateData: any = {
    full_name: data.full_name,
    bio: data.bio ?? null,
    university: data.university ?? null,
    study_program: data.study_program ?? null,
    github_url: data.github_url ?? null,
    linkedin_url: data.linkedin_url ?? null,
    website_url: data.website_url ?? null,
    twitter_url: data.twitter_url ?? null,
    year_of_study: data.year_of_study ? Number(data.year_of_study) : null,
    graduation_year: data.graduation_year ? Number(data.graduation_year) : null,
    academic_interests: data.academic_interests ?? null,
    skills: data.skills ?? null,
    profile_color: data.profile_color || '#3B82F6',
  };

  // Handle image URLs - update if provided, set to null if explicitly empty string
  if (avatar_url !== undefined) {
    updateData.avatar_url = avatar_url === '' ? null : avatar_url;
  }
  if (profile_banner_url !== undefined) {
    updateData.profile_banner_url = profile_banner_url === '' ? null : profile_banner_url;
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
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

export async function uploadProfileImage(formData: FormData) {
  const supabase: any = await createServerSupabaseClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Morate biti prijavljeni' };
  }

  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'avatar' or 'banner'

  if (!file) {
    return { success: false, error: 'Datoteka nije pronađena' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Datoteka mora biti slika' };
  }

  // Validate file size
  const maxSize = type === 'avatar' ? 10 * 1024 * 1024 : 15 * 1024 * 1024; // 10MB for avatar, 15MB for banner
  if (file.size > maxSize) {
    return { success: false, error: `Datoteka je prevelika. Maksimalno ${maxSize / (1024 * 1024)}MB` };
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const folder = type === 'avatar' ? 'avatars' : 'banners';
  const filePath = `${folder}/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-images').getPublicUrl(filePath);

    // Immediately update the profile with the new image URL
    const updateField = type === 'avatar' ? 'avatar_url' : 'profile_banner_url';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [updateField]: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: 'Slika je učitana ali nije spremljena u profil: ' + updateError.message };
    }

    // Get username for cache revalidation
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile) {
      revalidatePath(`/forum/user/${profile.username}`);
      revalidatePath(`/forum/user/${profile.username}/edit`);
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message || 'Greška pri učitavanju slike' };
  }
}
