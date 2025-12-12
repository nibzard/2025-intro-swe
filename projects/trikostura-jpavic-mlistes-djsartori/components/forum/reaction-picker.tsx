'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleReaction } from '@/app/forum/reactions/actions';
import { REACTION_EMOJIS, type ReactionEmoji } from '@/app/forum/reactions/constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  created_at: string;
}

interface ReactionPickerProps {
  replyId?: string;
  topicId?: string;
  reactions: Reaction[];
  currentUserId?: string;
  compact?: boolean;
}

export function ReactionPicker({
  replyId,
  topicId,
  reactions,
  currentUserId,
  compact = false,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticReactions, setOptimisticReactions] = useState<Reaction[]>(reactions);

  // Group reactions by emoji
  const groupedReactions = optimisticReactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!currentUserId) {
      toast.error('Morate biti prijavljeni za reakciju');
      return;
    }

    // Optimistic update
    const existingReaction = optimisticReactions.find(
      (r) => r.emoji === emoji && r.user_id === currentUserId
    );

    if (existingReaction) {
      // Remove reaction optimistically
      setOptimisticReactions(optimisticReactions.filter((r) => r.id !== existingReaction.id));
    } else {
      // Add reaction optimistically
      setOptimisticReactions([
        ...optimisticReactions,
        {
          id: `temp-${Date.now()}`,
          emoji,
          user_id: currentUserId,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setShowPicker(false);

    startTransition(async () => {
      const result = await toggleReaction({ emoji, replyId, topicId });

      if (result.error) {
        // Revert optimistic update on error
        setOptimisticReactions(reactions);
        toast.error(result.error);
      }
    });
  };

  const availableEmojis = Object.values(REACTION_EMOJIS);

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
          const hasUserReacted = reactionList.some((r) => r.user_id === currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => currentUserId && handleReaction(emoji as ReactionEmoji)}
              disabled={isPending || !currentUserId}
              className={`
                text-xs px-2 py-0.5 rounded-full transition-all
                flex items-center gap-1
                ${
                  hasUserReacted
                    ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500/50'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${!currentUserId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              title={reactionList.map((r) => r.user_id).join(', ')}
            >
              <span>{emoji}</span>
              <span className="text-gray-600 dark:text-gray-400">{reactionList.length}</span>
            </button>
          );
        })}

        {currentUserId && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '+'}
            </button>

            {showPicker && (
              <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-10">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                    disabled={isPending}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Display existing reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
            const hasUserReacted = reactionList.some((r) => r.user_id === currentUserId);
            return (
              <button
                key={emoji}
                onClick={() => currentUserId && handleReaction(emoji as ReactionEmoji)}
                disabled={isPending || !currentUserId}
                className={`
                  px-3 py-1.5 rounded-full transition-all
                  flex items-center gap-2
                  ${
                    hasUserReacted
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500/50'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                  ${!currentUserId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
                title={`Reacted by ${reactionList.length} user(s)`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {reactionList.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reaction picker */}
      {currentUserId && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>😊</span>
                <span>Dodaj reakciju</span>
              </>
            )}
          </Button>

          {showPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
              />

              {/* Picker */}
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 flex gap-2 z-20">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={isPending}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
