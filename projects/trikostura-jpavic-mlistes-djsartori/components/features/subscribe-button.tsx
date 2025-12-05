'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface SubscribeButtonProps {
  topicId: string;
  userId?: string;
}

export function SubscribeButton({ topicId, userId }: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      checkSubscription();
    }
  }, [userId, topicId]);

  async function checkSubscription() {
    const supabase = createClient();
    const { data } = await supabase
      .from('topic_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    setIsSubscribed(!!data);
  }

  async function toggleSubscription() {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (isSubscribed) {
      await supabase
        .from('topic_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('topic_id', topicId);
      setIsSubscribed(false);
    } else {
      await supabase
        .from('topic_subscriptions')
        .insert({
          user_id: userId,
          topic_id: topicId,
          notify_app: true,
          notify_email: false,
        });
      setIsSubscribed(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={isSubscribed ? 'default' : 'outline'}
      onClick={toggleSubscription}
      disabled={loading}
      className="font-semibold"
    >
      {isSubscribed ? (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Subscribed
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Subscribe
        </>
      )}
    </Button>
  );
}
