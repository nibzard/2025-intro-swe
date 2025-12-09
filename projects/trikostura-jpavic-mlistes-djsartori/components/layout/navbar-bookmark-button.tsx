'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useButtonAnimation, useIconAnimation } from '@/hooks/use-button-animation';
import { onBookmarkEvent } from '@/lib/bookmark-events';

export function NavbarBookmarkButton() {
  const { triggerAnimation: triggerButtonAnimation, animationClasses: buttonAnimation, isAnimating: isButtonAnimating } = useButtonAnimation();
  const { triggerAnimation: triggerIconAnimation, animationClasses: iconAnimation } = useIconAnimation();

  useEffect(() => {
    const unsubscribe = onBookmarkEvent((detail) => {
      // Trigger animation when bookmark event is received
      triggerButtonAnimation();
      triggerIconAnimation();
    });

    return unsubscribe;
  }, [triggerButtonAnimation, triggerIconAnimation]);

  return (
    <Link href="/forum/bookmarks" title="Moje oznake">
      <Button
        variant="ghost"
        size="sm"
        className={`${buttonAnimation} ${isButtonAnimating ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
      >
        <Bookmark className={`w-4 h-4 ${iconAnimation} ${isButtonAnimating ? 'fill-current' : ''}`} />
      </Button>
    </Link>
  );
}
