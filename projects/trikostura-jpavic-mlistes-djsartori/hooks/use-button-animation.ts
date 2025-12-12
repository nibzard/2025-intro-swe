import { useState, useCallback } from 'react';

export function useButtonAnimation(duration: number = 600) {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  }, [duration]);

  const animationClasses = isAnimating
    ? 'animate-pulse scale-110 transition-transform duration-300'
    : '';

  return {
    isAnimating,
    triggerAnimation,
    animationClasses,
  };
}

export function useIconAnimation(duration: number = 600) {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  }, [duration]);

  const animationClasses = isAnimating ? 'animate-bounce' : '';

  return {
    isAnimating,
    triggerAnimation,
    animationClasses,
  };
}
