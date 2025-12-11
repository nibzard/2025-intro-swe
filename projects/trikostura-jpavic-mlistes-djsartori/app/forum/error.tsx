'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Forum error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Greška pri učitavanju
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Došlo je do problema pri učitavanju foruma. Molimo pokušajte ponovno.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="w-full mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Pokušaj ponovno
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Početna
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
