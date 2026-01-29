'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/app/forum/bookmark/actions';
import { toast } from 'sonner';
import { useButtonAnimation, useIconAnimation } from '@/hooks/use-button-animation';
import { emitBookmarkEvent } from '@/lib/bookmark-events';

interface BookmarkButtonProps {
  topicId: string;
  initialBookmarked: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function BookmarkButton({
  topicId,
  initialBookmarked,
  variant = 'outline',
  size = 'sm',
  showText = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const { triggerAnimation: triggerButtonAnimation, animationClasses: buttonAnimation, isAnimating } = useButtonAnimation();
  const { triggerAnimation: triggerIconAnimation, animationClasses: iconAnimation } = useIconAnimation();
  const [animatingAction, setAnimatingAction] = useState<'bookmark' | 'unbookmark' | null>(null);

  async function handleToggle() {
    setIsLoading(true);

    try {
      const result = await toggleBookmark(topicId);

      if (result.success) {
        // Track the action for animation color
        setAnimatingAction(result.bookmarked ? 'bookmark' : 'unbookmark');

        setIsBookmarked(result.bookmarked!);
        toast.success(result.bookmarked ? 'Tema spremljena' : 'Oznaka uklonjena');

        // Trigger flash animation
        triggerButtonAnimation();
        triggerIconAnimation();

        // Emit event for navbar notification
        emitBookmarkEvent({ topicId, bookmarked: result.bookmarked! });
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch {
      toast.error('Doslo je do greske');
    } finally {
      setIsLoading(false);
    }
  }

  // Determine color during animation
  const getColorClasses = () => {
    if (isAnimating) {
      if (animatingAction === 'bookmark') {
        return 'text-yellow-500 hover:text-yellow-600';
      } else if (animatingAction === 'unbookmark') {
        return 'text-gray-400 hover:text-gray-500';
      }
    }
    return isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : '';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={`${getColorClasses()} ${buttonAnimation}`}
      title={isBookmarked ? 'Ukloni oznaku' : 'Spremi temu'}
    >
      <Bookmark
        className={`
          w-4 h-4
          ${showText ? 'mr-2' : ''}
          ${isBookmarked || (isAnimating && animatingAction === 'bookmark') ? 'fill-current' : ''}
          ${iconAnimation}
        `}
      />
      {showText && (isBookmarked ? 'Spremljeno' : 'Spremi')}
    </Button>
  );
}
