'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

export async function login(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ email, password });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Nevažeći email ili lozinka' };
  }

  revalidatePath('/', 'layout');
  redirect('/forum');
}

export async function register(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const full_name = formData.get('full_name') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const validation = registerSchema.safeParse({
    email,
    username,
    full_name,
    password,
    confirmPassword,
  });

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createServerSupabaseClient();

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingUser) {
    return { error: 'Korisničko ime je već zauzeto' };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile with username (since trigger creates it with email as username)
  if (data.user) {
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ username, full_name })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
    }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      error: 'Registracija uspješna! Molimo provjerite email za potvrdu računa.',
      success: true
    };
  }

  revalidatePath('/', 'layout');
  redirect('/forum');
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
