'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Check for error in URL
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const next = searchParams.get('next');

      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      // Check if session already exists (set by Supabase's /auth/v1/verify endpoint)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        if (next === '/auth/update-password') {
          router.push('/auth/update-password');
          return;
        }
        router.push(next || '/forum');
        return;
      }

      // Check for hash fragment tokens (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setError('Greška pri uspostavljanju sesije');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Redirect based on type
        if (type === 'recovery' || next === '/auth/update-password') {
          router.push('/auth/update-password');
        } else {
          router.push(next || '/forum');
        }
      } else {
        // No tokens in hash, check for PKCE code
        const code = searchParams.get('code');
        const isPasswordReset = next === '/auth/update-password';

        if (!code) {
          if (isPasswordReset) {
            setError('Link za resetiranje lozinke nije valjan ili je istekao. Molimo zatražite novi link.');
            setTimeout(() => router.push('/auth/reset-password'), 3000);
          } else {
            setError('Nedostaju podaci za autentifikaciju');
            setTimeout(() => router.push('/auth/login'), 3000);
          }
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          // Handle specific error cases
          if (error.message?.includes('already been used')) {
            setError('Link je već iskorišten. Molimo zatražite novi link za resetiranje lozinke.');
          } else if (error.message?.includes('expired')) {
            setError('Link je istekao. Molimo zatražite novi link za resetiranje lozinke.');
          } else if (error.message?.includes('code verifier') || error.message?.includes('code_verifier')) {
            if (isPasswordReset) {
              setError('PKCE konfiguracija ne radi za password reset. Kontaktiraj administratora da provjeri Supabase postavke ili koristi custom password reset implementaciju.');
            } else {
              setError('Greška u PKCE autentifikaciji. Pokušaj se prijaviti ponovno.');
            }
          } else {
            setError(`Greška pri autentifikaciji: ${error.message}`);
          }

          const redirectPath = isPasswordReset ? '/auth/reset-password' : '/auth/login';
          setTimeout(() => router.push(redirectPath), 4000);
          return;
        }

        router.push(next || '/forum');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold">
              {error}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Preusmjeravanje na prijavu...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Autentifikacija u tijeku...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
