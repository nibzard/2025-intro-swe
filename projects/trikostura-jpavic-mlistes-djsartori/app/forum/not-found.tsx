import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Home, Search } from 'lucide-react';

export default function ForumNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg mx-auto">
        <div className="mb-6">
          <MessageSquare className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Tema ili stranica nije pronađena
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tema koju tražite možda je uklonjena ili nikada nije postojala.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/forum">
            <Button variant="gradient" size="lg" className="gap-2">
              <Home className="w-5 h-5" />
              Forum Početna
            </Button>
          </Link>
          <Link href="/forum/search">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="w-5 h-5" />
              Pretraži Forum
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
