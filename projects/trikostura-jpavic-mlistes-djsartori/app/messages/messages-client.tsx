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
      return 'Jucer';
    } else if (days < 7) {
      return date.toLocaleDateString('hr-HR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });
    }
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
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretrazi razgovore..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nema razgovora</p>
                <p className="text-sm mt-1">
                  Posaljite poruku nekome da zapocnete razgovor
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => loadMessages(conversation)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={conversation.other_user?.avatar_url}
                      alt={conversation.other_user?.username || ''}
                      username={conversation.other_user?.username || '?'}
                      size="md"
                    />
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium truncate ${conversation.unread_count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {conversation.other_user?.username || 'Nepoznato'}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.last_message && formatTime(conversation.last_message.created_at)}
                      </span>
                    </div>
                    {conversation.last_message && (
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>
                        {conversation.last_message.sender_id === currentUserId && 'Ti: '}
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
        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar
                  src={selectedConversation.other_user?.avatar_url}
                  alt={selectedConversation.other_user?.username || ''}
                  username={selectedConversation.other_user?.username || '?'}
                  size="sm"
                />
                <div>
                  <Link
                    href={`/forum/user/${selectedConversation.other_user?.username}`}
                    className="font-medium hover:underline"
                  >
                    {selectedConversation.other_user?.username}
                  </Link>
                  {selectedConversation.other_user?.full_name && (
                    <p className="text-xs text-gray-500">
                      {selectedConversation.other_user.full_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Nema poruka. Pocnite razgovor!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          message.sender_id === currentUserId
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-700 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === currentUserId
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Napisi poruku..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="rounded-full px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Odaberite razgovor</p>
                <p className="text-sm mt-1">ili posaljite poruku nekome s profila</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
