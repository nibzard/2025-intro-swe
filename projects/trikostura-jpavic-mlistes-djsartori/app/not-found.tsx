'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SkriptaLogo } from '@/components/branding/skripta-logo';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <SkriptaLogo size={80} />
        </div>

        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gradient mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Stranica nije pronađena
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Ups! Stranica koju tražite ne postoji ili je uklonjena.
            <br />
            Možda ste napravili grešku u adresi ili je link zastareo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/forum">
            <Button variant="gradient" size="lg" className="gap-2">
              <Home className="w-5 h-5" />
              Idi na Forum
            </Button>
          </Link>
          <Link href="/forum/search">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="w-5 h-5" />
              Pretraži
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
            Natrag
          </Button>
        </div>

        <div className="mt-12 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            Trebate pomoć?
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Posjetite naš forum i postavite pitanje. Zajednica će vam rado pomoći!
          </p>
        </div>
      </div>
    </div>
  );
}
