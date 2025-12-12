'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Ups! Nešto je pošlo po zlu
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Došlo je do neočekivane greške. Naš tim je obaviješten i radimo na rješenju.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="w-full mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    Development Error:
                  </p>
                  <p className="text-xs font-mono text-red-700 dark:text-red-400 break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={reset}
                  size="lg"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Pokušaj ponovno
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  size="lg"
                  variant="outline"
                >
                  Idi na početnu
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
