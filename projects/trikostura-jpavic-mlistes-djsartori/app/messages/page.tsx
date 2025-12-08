import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getConversations } from './actions';
import { MessagesClient } from './messages-client';

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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Poruke
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Privatni razgovori s drugim korisnicima
        </p>
      </div>

      <MessagesClient
        initialConversations={conversations}
        currentUserId={user.id}
        initialConversationId={conversationId}
      />
    </div>
  );
}
