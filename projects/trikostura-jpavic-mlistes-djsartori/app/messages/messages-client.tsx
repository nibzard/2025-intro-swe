'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Send, ArrowLeft, Search } from 'lucide-react';
import { getMessages, sendMessage } from './actions';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

interface MessagesClientProps {
  initialConversations: Conversation[];
  currentUserId: string;
  initialConversationId?: string;
}

export function MessagesClient({ initialConversations, currentUserId, initialConversationId }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-load conversation if initialConversationId is provided
  useEffect(() => {
    if (initialConversationId && !hasLoadedInitial) {
      const conversation = conversations.find((c) => c.id === initialConversationId);
      if (conversation) {
        loadMessages(conversation);
      }
      setHasLoadedInitial(true);
    }
  }, [initialConversationId, conversations, hasLoadedInitial]);

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (conversation: Conversation) => {
    setIsLoading(true);
    setSelectedConversation(conversation);

    const { messages: fetchedMessages, error } = await getMessages(conversation.id);

    if (error) {
      toast.error(error);
    } else {
      setMessages(fetchedMessages);
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        )
      );
    }

    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConversation || !newMessage.trim()) return;

    setIsSending(true);

    const { success, error } = await sendMessage(selectedConversation.id, newMessage);

    if (success) {
      // Add message locally for instant feedback
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: currentUserId,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage('');

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                last_message: {
                  content: newMessage,
                  sender_id: currentUserId,
                  created_at: new Date().toISOString(),
                },
                last_message_at: new Date().toISOString(),
              }
            : c
        )
      );
    } else {
      toast.error(error || 'Greska pri slanju poruke');
    }

    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Jučer';
    } else if (days < 7) {
      return date.toLocaleDateString('hr-HR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'Danas';
    } else if (isYesterday) {
      return 'Jučer';
    } else {
      return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const shouldShowDateDivider = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();

    return currentDate !== previousDate;
  };

  // Mobile: Show conversation list or messages
  // Desktop: Show both side by side
  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 flex-shrink-0 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži razgovore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nema razgovora</p>
                <p className="text-sm mt-1">
                  Pošaljite poruku nekome da započnete razgovor
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => loadMessages(conversation)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 pl-3'
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={conversation.other_user?.avatar_url}
                      alt={conversation.other_user?.username || ''}
                      username={conversation.other_user?.username || '?'}
                      size="md"
                    />
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-semibold truncate ${conversation.unread_count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {conversation.other_user?.username || 'Nepoznato'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {conversation.last_message && formatTime(conversation.last_message.created_at)}
                      </span>
                    </div>
                    {conversation.last_message && (
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conversation.last_message.sender_id === currentUserId && (
                          <span className="text-gray-500 dark:text-gray-400">Ti: </span>
                        )}
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 flex flex-col ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}
      >
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Natrag na razgovore"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar
                  src={selectedConversation.other_user?.avatar_url}
                  alt={selectedConversation.other_user?.username || ''}
                  username={selectedConversation.other_user?.username || '?'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/forum/user/${selectedConversation.other_user?.username}`}
                    className="font-semibold hover:underline block truncate text-gray-900 dark:text-white"
                  >
                    {selectedConversation.other_user?.username}
                  </Link>
                  {selectedConversation.other_user?.full_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedConversation.other_user.full_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nema poruka</p>
                      <p className="text-sm mt-1">Započnite razgovor!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={message.id}>
                      {shouldShowDateDivider(message, index > 0 ? messages[index - 1] : null) && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {formatMessageDate(message.created_at)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex ${
                          message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${
                            message.sender_id === currentUserId
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === currentUserId
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-800/50"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Napiši poruku..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isSending}
                  maxLength={1000}
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="rounded-full px-5 py-2.5 h-auto"
                  size="sm"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/30">
              <div className="text-center p-8">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Odaberite razgovor</p>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                  Kliknite na razgovor s lijeve strane<br />ili pošaljite poruku nekome s profila
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
