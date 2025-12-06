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

      if (errorParam) {
        console.error('Auth error from URL:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      console.log('Auth callback initiated:', {
        hasCode: !!searchParams.get('code'),
        hasHash: !!window.location.hash,
        next: searchParams.get('next')
      });

      // Handle hash fragment for password recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        // Set the session using the tokens from the hash
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          setError('Greška pri uspostavljanju sesije');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Redirect based on type
        const next = searchParams.get('next');
        if (type === 'recovery' || next === '/auth/update-password') {
          router.push('/auth/update-password');
        } else {
          router.push(next || '/forum');
        }
      } else {
        // No tokens in hash, check for PKCE code
        const code = searchParams.get('code');
        const next = searchParams.get('next');

        if (code) {
          console.log('Attempting code exchange for:', next || 'login');

          // Try exchanging the code for a session
          // Note: Server-initiated flows (like password reset) might not require code_verifier
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Code exchange error:', {
              message: error.message,
              status: error.status,
              code: error.code,
              name: error.name
            });

            // Handle specific error cases
            if (error.message?.includes('already been used')) {
              setError('Link je već iskorišten. Molimo zatražite novi link za resetiranje lozinke.');
            } else if (error.message?.includes('expired')) {
              setError('Link je istekao. Molimo zatražite novi link za resetiranje lozinke.');
            } else if (error.message?.includes('code verifier')) {
              // PKCE verification failed - this shouldn't happen for password reset
              console.error('PKCE verifier error - password reset should use magic links');
              setError('Greška u konfiguraciji. Link nije valjan. Molimo zatražite novi link.');
            } else {
              setError(`Greška pri autentifikaciji: ${error.message}`);
            }

            setTimeout(() => {
              router.push(next === '/auth/update-password' ? '/auth/reset-password' : '/auth/login');
            }, 4000);
            return;
          }

          console.log('Code exchange successful');
          router.push(next || '/forum');
        } else {
          console.error('No authentication data found');
          setError('Nedostaju podaci za autentifikaciju');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
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
