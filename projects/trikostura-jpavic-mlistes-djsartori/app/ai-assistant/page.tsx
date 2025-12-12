import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ai-assistant/chat-interface';
import { createConversation, getConversations, getMessages } from './actions';
import { Bot, Plus, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AIAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation: conversationId } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Using Google Gemini (free tier)
  const aiProvider = 'Gemini';

  // Get user's conversations
  const { conversations, error: convsError } = await getConversations();

  let currentConversation = null;
  let messages = [];

  if (conversationId && conversations) {
    // Load selected conversation
    currentConversation = conversations.find((c: any) => c.id === conversationId);
    if (currentConversation) {
      const { messages: msgs } = await getMessages(conversationId);
      messages = msgs || [];
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Konverzacije
                  </CardTitle>
                  <form action={async () => {
                    'use server';
                    const result = await createConversation();
                    if (result.conversation) {
                      redirect(`/ai-assistant?conversation=${result.conversation.id}`);
                    }
                  }}>
                    <Button type="submit" size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                {conversations && conversations.length > 0 ? (
                  <div className="space-y-1">
                    {conversations.map((conv: any) => (
                      <Link
                        key={conv.id}
                        href={`/ai-assistant?conversation=${conv.id}`}
                        className={`block p-3 rounded-lg transition-colors ${
                          conversationId === conv.id
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conv.updated_at).toLocaleDateString('hr-HR')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                    Nema konverzacija
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {currentConversation ? (
              <Card className="h-full">
                <CardHeader className="border-b dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-6 h-6 text-purple-500" />
                      AI Studijski Asistent
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Sparkles className="w-3 h-3" />
                      {aiProvider ? `Powered by ${aiProvider}` : 'AI Assistant'}
                    </div>
                  </div>
                </CardHeader>
                <ChatInterface
                  conversationId={currentConversation.id}
                  initialMessages={messages}
                />
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto text-purple-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Dobrodošli u AI Studijski Asistent
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Vaš osobni AI asistent za pomoć pri učenju, domaćim zadacima i studijskim
                    savjetima.
                  </p>
                  <form action={async () => {
                    'use server';
                    const result = await createConversation();
                    if (result.conversation) {
                      redirect(`/ai-assistant?conversation=${result.conversation.id}`);
                    }
                  }}>
                    <Button type="submit" size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      Započni Novu Konverzaciju
                    </Button>
                  </form>

                  <div className="mt-12 text-left max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold mb-4">🎓 Što mogu pitati?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">📚 Pomoć pri učenju</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Objašnjenja koncepta, tehnike učenja, pripreme za ispite
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">💡 Domaći zadaci</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Smjernice, pojašnjenja problema, provjera razumijevanja
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">🎯 Studijski savjeti</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Organizacija vremena, motivacija, strategije učenja
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">🔍 Istraživanje tema</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pregled tema, preporuke izvora, sažeci sadržaja
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
