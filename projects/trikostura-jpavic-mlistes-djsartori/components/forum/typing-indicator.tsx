'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  topicId: string;
  currentUserId?: string;
  currentUsername?: string;
}

interface TypingUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  updated_at: string;
}

export function TypingIndicator({ topicId, currentUserId, currentUsername }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to typing indicators for this topic
    const channel = supabase
      .channel(`typing:${topicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `topic_id=eq.${topicId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingUserId = (payload.new as any).user_id;

            // Don't show current user's typing indicator
            if (typingUserId === currentUserId) return;

            // Fetch username and avatar
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', typingUserId)
              .single();

            if (profile) {
              setTypingUsers((prev) => {
                const filtered = prev.filter((u) => u.user_id !== typingUserId);
                const typedProfile = profile as { username: string; avatar_url: string | null };
                return [
                  ...filtered,
                  {
                    user_id: typingUserId,
                    username: typedProfile.username,
                    avatar_url: typedProfile.avatar_url,
                    updated_at: (payload.new as any).updated_at,
                  },
                ];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const typingUserId = (payload.old as any).user_id;
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== typingUserId));
          }
        }
      )
      .subscribe();

    // Clean up old typing indicators every 2 seconds
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setTypingUsers((prev) =>
        prev.filter((user) => {
          const updatedAt = new Date(user.updated_at);
          const diff = now.getTime() - updatedAt.getTime();
          return diff < 5000; // Remove if older than 5 seconds
        })
      );
    }, 2000);

    return () => {
      channel.unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [topicId, currentUserId, supabase]);

  if (typingUsers.length === 0) return null;

  const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0].username} piše...`
      : typingUsers.length === 2
      ? `${typingUsers[0].username} i ${typingUsers[1].username} pišu...`
      : `${typingUsers.length} korisnika piše...`;

  return (
    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar
            key={user.user_id}
            src={user.avatar_url}
            alt={user.username}
            username={user.username}
            size="sm"
            className="ring-2 ring-white dark:ring-gray-800"
          />
        ))}
      </div>
      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
      <span className="font-medium">{displayText}</span>
    </div>
  );
}

/**
 * Hook to broadcast typing status
 */
export function useTypingIndicator(topicId: string, currentUserId?: string) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const broadcastTyping = useCallback(async () => {
    if (!currentUserId || !topicId) return;

    try {
      const supabase = createClient(); // Fresh client for each call

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Upsert typing indicator
      await (supabase as any).from('typing_indicators').upsert(
        {
          topic_id: topicId,
          user_id: currentUserId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'topic_id,user_id',
        }
      );

      // Auto-remove after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          const supabase = createClient();
          await supabase
            .from('typing_indicators')
            .delete()
            .eq('topic_id', topicId)
            .eq('user_id', currentUserId);
        } catch (err) {
          // Silently fail on cleanup - user session may have ended
        }
      }, 3000);
    } catch (err) {
      console.error('Error broadcasting typing:', err);
      // Don't break the form if typing indicator fails
    }
  }, [topicId, currentUserId]);

  const stopTyping = useCallback(async () => {
    if (!currentUserId || !topicId) return;

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const supabase = createClient();
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', currentUserId);
    } catch (err) {
      console.error('Error stopping typing:', err);
      // Don't break the form if typing indicator fails
    }
  }, [topicId, currentUserId]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return { broadcastTyping, stopTyping };
}
