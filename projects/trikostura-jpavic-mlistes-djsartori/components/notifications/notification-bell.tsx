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
  const supabase = createClient();

  useEffect(() => {
    // Polling fallback - checks for new notifications every 30 seconds
    const setupPolling = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const pollNotifications = async () => {
        const { data: latestNotifications } = await (supabase as any)
          .from('notifications')
          .select(`
            *,
            actor:actor_id(username, avatar_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (latestNotifications) {
          setNotifications(latestNotifications);
          setUnreadCount(latestNotifications.filter((n: any) => !n.is_read).length);
        }
      };

      // Poll every 30 seconds
      const interval = setInterval(pollNotifications, 30000);

      return () => clearInterval(interval);
    };

    setupPolling();
  }, [supabase]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50">
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
