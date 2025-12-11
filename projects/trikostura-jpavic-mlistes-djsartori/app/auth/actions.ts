'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { sendVerificationEmail } from '@/app/auth/verify-email/actions';

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

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Nevažeći email ili lozinka' };
  }

  // Check if email is verified (if email confirmation is enabled)
  if (data.user && !data.user.email_confirmed_at) {
    // Sign out the user since they haven't verified their email
    await supabase.auth.signOut();
    return { error: 'Molimo potvrdite svoj email prije prijave. Provjerite svoju poštu.' };
  }

  // Check if profile exists, if not recreate it
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      // Profile is missing - recreate it (only if email is verified)
      const adminClient = createAdminClient();
      await (adminClient as any)
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split('@')[0] || 'user',
          full_name: data.user.user_metadata?.full_name || '',
        });
    }
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
  const adminClient = createAdminClient();

  // Check if username or email is already taken
  const { data: existingByUsername } = await supabase
    .from('profiles')
    .select('username, id, email')
    .eq('username', username)
    .maybeSingle();

  const { data: existingByEmail } = await supabase
    .from('profiles')
    .select('username, id, email')
    .eq('email', email)
    .maybeSingle();

  // Check username
  if (existingByUsername) {
    const { data: authUser } = await (adminClient as any).auth.admin.getUserById((existingByUsername as any).id);

    if (authUser?.user) {
      return { error: 'Korisničko ime je već zauzeto' };
    } else {
      // Orphaned profile - delete it
      await (adminClient as any)
        .from('profiles')
        .delete()
        .eq('id', (existingByUsername as any).id);
    }
  }

  // Check email
  if (existingByEmail) {
    const { data: authUser } = await (adminClient as any).auth.admin.getUserById((existingByEmail as any).id);

    if (authUser?.user) {
      return { error: 'Email je već zauzet' };
    } else {
      // Orphaned profile - delete it
      await (adminClient as any)
        .from('profiles')
        .delete()
        .eq('id', (existingByEmail as any).id);
    }
  }

  // Also check for orphaned auth users (auth exists but profile deleted)
  try {
    const { data: authUserByEmail } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = authUserByEmail?.users?.find((u: any) => u.email === email);

    if (existingAuthUser) {
      // Check if profile exists for this auth user
      const { data: profileForAuth } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', existingAuthUser.id)
        .maybeSingle();

      if (!profileForAuth) {
        // Orphaned auth user - delete it
        await adminClient.auth.admin.deleteUser(existingAuthUser.id);
      } else {
        // Both auth and profile exist
        return { error: 'Email je već zauzet' };
      }
    }
  } catch (error) {
    console.error('Error checking orphaned auth users:', error);
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
    // Check if user already exists in auth but profile was deleted
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'Ovaj email je već registriran. Molimo prijavite se umjesto registracije.' };
    }
    return { error: error.message };
  }

  // Update profile with username (since trigger creates it with email as username)
  if (data.user) {
    const { error: updateError } = await (adminClient as any)
      .from('profiles')
      .update({ username, full_name, email })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { error: 'Greška pri kreiranju profila' };
    }

    // Send verification email (skip auth check since user just registered)
    const emailResult = await sendVerificationEmail(data.user.id, true);
    if (!emailResult.success) {
      console.error('Verification email error:', emailResult.error);
    }
  }

  revalidatePath('/', 'layout');
  redirect('/auth/verify-email');
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
    console.error('Password reset email error:', emailResult.error);
    const errorMsg = (emailResult.error as any)?.message || 'Nepoznata greška';
    return { error: `Greška pri slanju emaila: ${errorMsg}` };
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
