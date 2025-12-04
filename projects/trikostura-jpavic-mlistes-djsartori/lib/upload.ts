import { createClient } from '@/lib/supabase/client';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-images').getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadBanner(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `banners/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-images').getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const supabase = createClient();

  // Extract file path from URL
  const urlParts = url.split('/profile-images/');
  if (urlParts.length !== 2) {
    throw new Error('Invalid image URL');
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage.from('profile-images').remove([filePath]);

  if (error) {
    throw error;
  }
}
