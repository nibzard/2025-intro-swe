'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/app/forum/bookmark/actions';
import { toast } from 'sonner';

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
  const [isFlashing, setIsFlashing] = useState(false);

  async function handleToggle() {
    setIsLoading(true);

    try {
      const result = await toggleBookmark(topicId);

      if (result.success) {
        setIsBookmarked(result.bookmarked!);
        toast.success(result.bookmarked ? 'Tema spremljena' : 'Oznaka uklonjena');

        // Trigger flash animation
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 600);
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch {
      toast.error('Doslo je do greske');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : ''}
        ${isFlashing ? 'animate-pulse scale-110 transition-transform duration-300' : ''}
      `}
      title={isBookmarked ? 'Ukloni oznaku' : 'Spremi temu'}
    >
      <Bookmark
        className={`
          w-4 h-4
          ${showText ? 'mr-2' : ''}
          ${isBookmarked ? 'fill-current' : ''}
          ${isFlashing ? 'animate-bounce' : ''}
        `}
      />
      {showText && (isBookmarked ? 'Spremljeno' : 'Spremi')}
    </Button>
  );
}
