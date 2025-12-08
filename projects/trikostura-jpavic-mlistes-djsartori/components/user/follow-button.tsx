'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followUser, unfollowUser } from '@/app/forum/user/actions';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  variant = 'outline',
  size = 'lg',
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    if (isFollowing) {
      const { success, error } = await unfollowUser(targetUserId);
      if (success) {
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success('Vise ne pratite ovog korisnika');
      } else {
        toast.error(error || 'Greska');
      }
    } else {
      const { success, error } = await followUser(targetUserId);
      if (success) {
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success('Sada pratite ovog korisnika');
      } else {
        toast.error(error || 'Greska');
      }
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'gradient'}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Otprati' : 'Prati'}
    </Button>
  );
}
