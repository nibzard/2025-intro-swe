'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { getOrCreateConversation } from '@/app/messages/actions';
import { toast } from 'sonner';

interface SendMessageButtonProps {
  targetUserId: string;
  targetUsername: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SendMessageButton({
  targetUserId,
  targetUsername,
  variant = 'outline',
  size = 'lg',
}: SendMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);

    const { conversationId, error } = await getOrCreateConversation(targetUserId);

    if (error) {
      toast.error(error);
      setIsLoading(false);
      return;
    }

    // Navigate to messages page (conversation will be loaded there)
    router.push(`/messages?conversation=${conversationId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
    >
      <Mail className="w-4 h-4 mr-2" />
      {isLoading ? 'Ucitavanje...' : 'Posalji poruku'}
    </Button>
  );
}
