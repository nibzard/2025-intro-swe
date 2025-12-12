'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/app/ai-assistant/actions';
import { toast } from 'sonner';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  initialMessages: Message[];
}

export function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message optimistically
    const tempUserMsg: Message = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendMessage(conversationId, userMessage);

      if (result.error) {
        toast.error(result.error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
        setInput(userMessage); // Restore input
      } else if (result.message) {
        // Replace temp message with real one and add assistant message
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== tempUserMsg.id),
          { ...tempUserMsg, id: 'user-' + Date.now() },
          result.message,
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Greška pri slanju poruke');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMsg.id));
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Kako mogu bolje učiti matematiku?',
    'Objasni mi programiranje u Pythonu',
    'Kako se pripremiti za ispit?',
    'Što je algoritmička složenost?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">👋 Bok! Ja sam tvoj AI asistent</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Postavi mi pitanje o učenju, domaćem zadatku ili studijskim savjetima
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="p-3 text-sm text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-2 text-purple-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <CardContent className="p-3">
                    {message.role === 'user' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    )}
                  </CardContent>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <span className="text-sm text-gray-500">Razmišljam...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Postavi pitanje..."
            disabled={isLoading}
            className="flex-1"
            maxLength={1000}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Savjet: AI može pogriješiti. Uvijek provjeri važne informacije.
        </p>
      </div>
    </div>
  );
}
