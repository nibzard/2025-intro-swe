import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getConversations } from './actions';
import { MessagesClient } from './messages-client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Poruke | Skripta',
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation: conversationId } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { conversations } = await getConversations();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/forum">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Poruke
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Privatni razgovori s drugim korisnicima
          </p>
        </div>
      </div>

      <MessagesClient
        initialConversations={conversations}
        currentUserId={user.id}
        initialConversationId={conversationId}
      />
    </div>
  );
}
