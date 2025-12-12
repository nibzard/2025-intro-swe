'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Check, Clock, Users } from 'lucide-react';
import { votePoll } from '@/app/forum/polls/actions';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  option_text: string;
  position: number;
  poll_votes?: { count: number }[];
}

interface Poll {
  id: string;
  topic_id: string;
  question: string;
  allow_multiple_choices: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PollWidgetProps {
  poll: Poll;
  options: PollOption[];
  totalVotes: number;
  userVotes: string[];
  currentUserId?: string;
}

export function PollWidget({
  poll,
  options,
  totalVotes: initialTotalVotes,
  userVotes: initialUserVotes,
  currentUserId,
}: PollWidgetProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialUserVotes);
  const [hasVoted, setHasVoted] = useState(initialUserVotes.length > 0);
  const [isPending, startTransition] = useTransition();
  const [showResults, setShowResults] = useState(hasVoted);

  // Calculate vote counts and percentages
  const optionsWithStats = options.map((option) => {
    const voteCount = (option.poll_votes?.[0]?.count as any) || 0;
    const percentage = initialTotalVotes > 0 ? (voteCount / initialTotalVotes) * 100 : 0;
    return {
      ...option,
      voteCount,
      percentage,
    };
  });

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isExpired || !currentUserId) return;

    if (poll.allow_multiple_choices) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Odaberi barem jednu opciju');
      return;
    }

    startTransition(async () => {
      const result = await votePoll({
        pollId: poll.id,
        optionIds: selectedOptions,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Glas uspješno predan!');
        setHasVoted(true);
        setShowResults(true);
      }
    });
  };

  const handleChangeVote = () => {
    setHasVoted(false);
    setShowResults(false);
    setSelectedOptions([]);
  };

  const getTimeRemaining = () => {
    if (!poll.expires_at) return null;

    const now = new Date();
    const expiry = new Date(poll.expires_at);
    const diff = expiry.getTime() - now.getTime();

    if (diff < 0) return 'Isteklo';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h preostalo`;
    if (hours > 0) return `${hours}h preostalo`;
    return 'Uskoro ističe';
  };

  return (
    <Card className="border-2 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-lg">{poll.question}</div>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400 font-normal">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {initialTotalVotes} {initialTotalVotes === 1 ? 'glas' : 'glasova'}
              </span>
              {poll.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeRemaining()}
                </span>
              )}
              {poll.allow_multiple_choices && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  Više odgovora
                </span>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!showResults ? (
          /* Voting Interface */
          <>
            {optionsWithStats.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionToggle(option.id)}
                disabled={!currentUserId || isExpired || isPending}
                className={`
                  w-full text-left p-3 rounded-lg border-2 transition-all
                  ${
                    selectedOptions.includes(option.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                  ${!currentUserId || isExpired ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${
                      selectedOptions.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                  >
                    {selectedOptions.includes(option.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium">{option.option_text}</span>
                </div>
              </button>
            ))}

            {currentUserId && !isExpired && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSubmitVote}
                  disabled={selectedOptions.length === 0 || isPending}
                  className="flex-1"
                >
                  {isPending ? 'Predavanje...' : 'Predaj glas'}
                </Button>
                {hasVoted && (
                  <Button variant="outline" onClick={() => setShowResults(true)}>
                    Prikaži rezultate
                  </Button>
                )}
              </div>
            )}

            {!currentUserId && (
              <p className="text-sm text-gray-500 text-center pt-2">
                Prijavi se za glasanje
              </p>
            )}

            {isExpired && (
              <p className="text-sm text-orange-600 dark:text-orange-400 text-center pt-2">
                Anketa je istekla
              </p>
            )}
          </>
        ) : (
          /* Results Display */
          <>
            {optionsWithStats.map((option) => {
              const isUserVote = initialUserVotes.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`
                    p-3 rounded-lg border
                    ${
                      isUserVote
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium">{option.option_text}</span>
                      {isUserVote && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.voteCount} ({option.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <Progress value={option.percentage} className="h-2" />
                </div>
              );
            })}

            {currentUserId && !isExpired && (
              <Button variant="outline" onClick={handleChangeVote} className="w-full mt-2">
                Promijeni glas
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
