'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NotificationList } from './notification-list';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/notifications';

interface NotificationBellProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Setup realtime subscription for instant notifications
    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel('notifications-bell')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const { data: newNotificationData } = await (supabase as any)
              .from('notifications')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (newNotificationData) {
              // Fetch actor data if actor_id exists
              let actor = null;
              if (newNotificationData.actor_id) {
                const { data: actorData } = await supabase
                  .from('profiles')
                  .select('id, username, avatar_url')
                  .eq('id', newNotificationData.actor_id)
                  .single();
                actor = actorData;
              }

              const newNotification = {
                ...newNotificationData,
                actor,
              };

              setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
              setUnreadCount((prev) => prev + 1);
              setHasNewNotification(true);

              // Reset animation after 3 seconds
              setTimeout(() => setHasNewNotification(false), 3000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n))
            );

            // Update unread count
            const wasRead = notifications.find((n) => n.id === payload.new.id)?.is_read;
            if (!wasRead && payload.new.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const deletedNotification = notifications.find((n) => n.id === payload.old.id);
            if (deletedNotification && !deletedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        )
        .subscribe();

      return { supabase, channel };
    };

    let cleanup: { supabase: any; channel: any } | null | undefined = null;
    setupRealtimeSubscription().then((result) => {
      cleanup = result;
    });

    return () => {
      if (cleanup) {
        cleanup.supabase.removeChannel(cleanup.channel);
      }
    };
  }, [supabase]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        title={`Obavijesti${unreadCount > 0 ? ` (${unreadCount} nepročitanih)` : ''}`}
        aria-label={`Obavijesti${unreadCount > 0 ? ` (${unreadCount} nepročitanih)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className={`w-5 h-5 ${hasNewNotification ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
              hasNewNotification ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 top-0 md:top-auto md:mt-2 z-50 p-4 md:p-0"
            role="dialog"
            aria-label="Panel s obavijestima"
          >
            <NotificationList
              notifications={notifications}
              onClose={() => setIsOpen(false)}
              onNotificationUpdate={(updatedNotifications) => {
                setNotifications(updatedNotifications);
                setUnreadCount(updatedNotifications.filter((n) => !n.is_read).length);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
