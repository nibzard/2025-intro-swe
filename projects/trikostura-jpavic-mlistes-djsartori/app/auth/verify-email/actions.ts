'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailVerification } from '@/lib/email';
import { z } from 'zod';

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const VerifyEmailSchema = z.object({
  code: z.string().length(6, 'Kod mora imati 6 znamenki'),
});

// Rate limiting: track last email sent time per user
const lastEmailSentMap = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60000; // 60 seconds cooldown

export async function sendVerificationEmail(userId: string, skipAuthCheck: boolean = false) {
  try {
    const supabase = await createServerSupabaseClient();

    // For normal calls, verify the user is authenticated
    if (!skipAuthCheck) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        return { success: false, error: 'Neautorizirano' };
      }
    }

    // Check rate limiting
    const lastSent = lastEmailSentMap.get(userId);
    if (lastSent) {
      const timeSinceLastSent = Date.now() - lastSent;
      if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
        return {
          success: false,
          error: `Pričekajte ${secondsRemaining} sekundi prije slanja novog koda`,
          cooldownRemaining: secondsRemaining
        };
      }
    }

    // Get profile using admin client to ensure we can read it
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await (adminClient as any)
      .from('profiles')
      .select('username, email, email_verified')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: 'Profil nije pronađen' };
    }

    if ((profile as any).email_verified) {
      return { success: false, error: 'Email je već verificiran' };
    }

    // Delete any existing tokens for this user
    await (adminClient as any)
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Store the token
    const { error: insertError } = await (adminClient as any)
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: (profile as any).email,
        token: code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Token insert error:', insertError);
      return { success: false, error: 'Greška pri kreiranju verifikacijskog koda' };
    }

    // Send email
    const emailResult = await sendEmailVerification(
      (profile as any).email,
      code,
      (profile as any).username || 'korisniče'
    );

    if (!emailResult.success) {
      console.error('Email send error:', emailResult.error);
      const errorMsg = (emailResult.error as any)?.message || 'Nepoznata greška';
      return { success: false, error: `Greška pri slanju emaila: ${errorMsg}` };
    }

    // Update rate limiting
    lastEmailSentMap.set(userId, Date.now());

    return { success: true };
  } catch (error) {
    console.error('sendVerificationEmail error:', error);
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
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
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
