'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Registracija uspješna! Molimo provjerite email za potvrdu.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push('/forum');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Sva polja su obavezna');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      setError('Neispravna email adresa ili lozinka');
      setLoading(false);
    } else {
      router.push('/forum');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Dobrodošli natrag!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Prijavi se za nastavak
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3 animate-slide-up">
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 px-4 py-3 rounded-lg flex items-start gap-3 animate-slide-up">
              <span className="text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Email adresa
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 transition-all"
                  placeholder="tvoj.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Lozinka
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
          >
{loading ? 'Prijava...' : 'Prijavi se'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">ili</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Nemaš račun?{' '}
            <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
              Registriraj se besplatno
            </Link>
          </p>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">Učitavanje...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
