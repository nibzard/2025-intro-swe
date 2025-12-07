'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { sendPasswordResetEmail } from '@/lib/email';

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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
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

    // Profile update error is non-critical, user registration still succeeds
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

export async function resetPassword(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Molimo unesite valjanu email adresu' };
  }

  const supabase = await createServerSupabaseClient();

  // Check if user exists by looking up in profiles table
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    // Don't reveal if user doesn't exist for security
    return {
      success: true,
    };
  }

  // Generate a simple 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

  // Store the reset code
  const { error: tokenError } = await (supabase as any)
    .from('password_reset_tokens')
    .insert({
      user_id: profile.id,
      token: resetCode,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

  if (tokenError) {
    return { error: `Greška pri stvaranju tokena: ${tokenError.message || 'Nepoznata greška'}. Jeste li pokrenuli SQL skriptu?` };
  }

  // Send the reset code via email
  const emailResult = await sendPasswordResetEmail(email, resetCode);

  if (!emailResult.success) {
    return { error: 'Greška pri slanju emaila. Molimo pokušajte ponovno.' };
  }

  return {
    success: true,
  };
}

export async function verifyResetCodeAndUpdatePassword(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const code = formData.get('code') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!code || code.length !== 6) {
    return { error: 'Unesite važeći 6-znamenkasti kod' };
  }

  if (!password || password.length < 6) {
    return { error: 'Lozinka mora imati najmanje 6 znakova' };
  }

  if (password !== confirmPassword) {
    return { error: 'Lozinke se ne podudaraju' };
  }

  const supabase = await createServerSupabaseClient();

  // Verify the reset code
  const { data: tokenData, error: tokenError } = await (supabase as any)
    .from('password_reset_tokens')
    .select('*')
    .eq('token', code)
    .eq('used', false)
    .single();

  if (tokenError || !tokenData) {
    return { error: 'Nevažeći ili istekli kod' };
  }

  // Check if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { error: 'Kod je istekao. Molimo zatražite novi.' };
  }

  // Update password using admin client
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    tokenData.user_id,
    { password: password }
  );

  if (updateError) {
    return { error: `Greška pri ažuriranju lozinke: ${updateError.message}` };
  }

  // Mark token as used
  await (supabase as any)
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', tokenData.id);

  revalidatePath('/', 'layout');
  redirect('/auth/login?reset=success');
}

export async function updatePassword(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { error: 'Lozinka mora imati najmanje 6 znakova' };
  }

  if (password !== confirmPassword) {
    return { error: 'Lozinke se ne podudaraju' };
  }

  const supabase = await createServerSupabaseClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sesija je istekla. Molimo zatražite novi link za resetiranje lozinke.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { error: `Greška: ${error.message || 'Došlo je do greške prilikom ažuriranja lozinke'}` };
  }

  revalidatePath('/', 'layout');
  redirect('/auth/login?reset=success');
}
