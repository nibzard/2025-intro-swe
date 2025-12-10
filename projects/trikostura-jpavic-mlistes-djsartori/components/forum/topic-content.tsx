'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ReplyForm } from '@/components/forum/reply-form';
import { ReplyCard } from '@/components/forum/reply-card';
import { MessageSquare } from 'lucide-react';

interface TopicContentProps {
  topic: any;
  replies: any[];
  userVotes: any;
  currentUserId?: string;
}

export function TopicContent({ topic, replies, userVotes, currentUserId }: TopicContentProps) {
  const [quotedText, setQuotedText] = useState<string | undefined>();
  const [quotedAuthor, setQuotedAuthor] = useState<string | undefined>();
  const replyFormRef = useRef<HTMLDivElement>(null);

  const handleQuote = (content: string, author: string) => {
    setQuotedText(content);
    setQuotedAuthor(author);

    // Scroll to reply form
    setTimeout(() => {
      replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleClearQuote = () => {
    setQuotedText(undefined);
    setQuotedAuthor(undefined);
  };

  useEffect(() => {
    // Clear quote when form is submitted (content changes)
    if (quotedText) {
      const timer = setTimeout(() => {
        setQuotedText(undefined);
        setQuotedAuthor(undefined);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [replies.length]); // Reset when replies change (new reply added)

  const isTopicAuthor = currentUserId === topic.author_id;

  return (
    <>
      {replies && replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Odgovori ({replies.length})
          </h2>
          {replies.map((reply: any) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              userVote={userVotes[reply.id]}
              isLoggedIn={!!currentUserId}
              currentUserId={currentUserId}
              isTopicAuthor={isTopicAuthor}
              onQuote={handleQuote}
            />
          ))}
        </div>
      )}

      {currentUserId && !topic.is_locked && (
        <Card ref={replyFormRef}>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Dodaj odgovor</h3>
            <ReplyForm
              topicId={topic.id}
              quotedText={quotedText}
              quotedAuthor={quotedAuthor}
              onClearQuote={handleClearQuote}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
