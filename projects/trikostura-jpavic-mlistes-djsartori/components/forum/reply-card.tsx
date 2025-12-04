'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ReplyCardProps {
  reply: any;
  userVote?: number;
  isLoggedIn: boolean;
}

export function ReplyCard({ reply, userVote, isLoggedIn }: ReplyCardProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [upvotes, setUpvotes] = useState(reply.upvotes);
  const [downvotes, setDownvotes] = useState(reply.downvotes);
  const [isVoting, setIsVoting] = useState(false);
  const router = useRouter();

  async function handleVote(voteType: number) {
    if (!isLoggedIn || isVoting) return;

    setIsVoting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsVoting(false);
      return;
    }

    // If user is clicking the same vote, remove it
    if (currentVote === voteType) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('reply_id', reply.id);

      setCurrentVote(undefined);
      if (voteType === 1) {
        setUpvotes(upvotes - 1);
      } else {
        setDownvotes(downvotes - 1);
      }
    }
    // If user is changing vote
    else if (currentVote) {
      await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('user_id', user.id)
        .eq('reply_id', reply.id);

      if (voteType === 1) {
        setUpvotes(upvotes + 1);
        setDownvotes(downvotes - 1);
      } else {
        setDownvotes(downvotes + 1);
        setUpvotes(upvotes - 1);
      }
      setCurrentVote(voteType);
    }
    // New vote
    else {
      await supabase.from('votes').insert({
        user_id: user.id,
        reply_id: reply.id,
        vote_type: voteType,
      });

      setCurrentVote(voteType);
      if (voteType === 1) {
        setUpvotes(upvotes + 1);
      } else {
        setDownvotes(downvotes + 1);
      }
    }

    setIsVoting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant={currentVote === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!isLoggedIn || isVoting}
              className="w-10 h-10 p-0"
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold">
              {upvotes - downvotes}
            </span>
            <Button
              variant={currentVote === -1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!isLoggedIn || isVoting}
              className="w-10 h-10 p-0"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-semibold">{reply.author?.username}</span>
              <span className="text-sm text-gray-500">
                {new Date(reply.created_at).toLocaleDateString('hr-HR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {reply.author?.reputation > 0 && (
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                  {reply.author.reputation} rep
                </span>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{reply.content}</p>
            </div>

            {reply.is_solution && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm font-medium">
                ✓ Označeno kao rješenje
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
