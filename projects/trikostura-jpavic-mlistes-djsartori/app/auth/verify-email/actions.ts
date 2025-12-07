'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmailVerification } from '@/lib/email';
import { z } from 'zod';

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const VerifyEmailSchema = z.object({
  code: z.string().length(6, 'Kod mora imati 6 znamenki'),
});

export async function sendVerificationEmail(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user data
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email, email_verified')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    if ((profile as any).email_verified) {
      return { success: false, error: 'Email je već verificiran' };
    }

    // Delete any existing tokens for this user
    await (supabase as any)
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Store the token
    const { error: insertError } = await (supabase as any)
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: (profile as any).email,
        token: code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      return { success: false, error: 'Greška pri kreiranju verifikacijskog koda' };
    }

    // Send email
    const emailResult = await sendEmailVerification(
      (profile as any).email,
      code,
      (profile as any).username
    );

    if (!emailResult.success) {
      return { success: false, error: 'Greška pri slanju emaila' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Došlo je do greške' };
  }
}

export async function verifyEmailCode(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Morate biti prijavljeni' };
    }

    // Validate input
    const validatedData = VerifyEmailSchema.parse({
      code: formData.get('code'),
    });

    // Find the token
    const { data: token, error: fetchError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', validatedData.code)
      .is('used_at', null)
      .single();

    if (fetchError || !token) {
      return { success: false, error: 'Nevažeći ili istekli kod' };
    }

    const tokenData = token as any;

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'Kod je istekao. Zatražite novi kod.' };
    }

    // Mark token as used
    await (supabase as any)
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Update profile to mark email as verified
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: 'Greška pri ažuriranju profila' };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Došlo je do greške' };
  }
}

export async function resendVerificationEmail() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Morate biti prijavljeni' };
    }

    return await sendVerificationEmail(user.id);
  } catch (error) {
    return { success: false, error: 'Došlo je do greške' };
  }
}
