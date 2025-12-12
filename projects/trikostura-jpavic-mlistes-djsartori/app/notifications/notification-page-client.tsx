'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ThumbsUp, Pin, X, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types/notifications';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './actions';
import { createClient } from '@/lib/supabase/client';

interface NotificationPageClientProps {
  initialNotifications: Notification[];
}

export function NotificationPageClient({ initialNotifications }: NotificationPageClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const router = useRouter();

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel('notifications-page')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const { data: newNotification } = await (supabase as any)
              .from('notifications')
              .select(`
                *,
                actor:actor_id(username, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newNotification) {
              setNotifications((prev) => [newNotification, ...prev]);
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
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply_to_topic':
      case 'reply_to_reply':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'upvote':
        return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'topic_pinned':
        return <Pin className="w-5 h-5 text-yellow-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Upravo sada';
    if (diffInSeconds < 3600) return `Prije ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Prije ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Prije ${Math.floor(diffInSeconds / 86400)} dana`;
    return date.toLocaleDateString('hr-HR');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {unreadCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 sm:pb-4 border-b">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {unreadCount} nepročitanih obavijesti
          </p>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="w-full sm:w-auto text-xs sm:text-sm">
            <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Označi sve kao pročitano
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-8 sm:py-12 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
          <p className="text-base sm:text-lg font-medium">Nemaš obavijesti</p>
          <p className="text-xs sm:text-sm mt-2 px-4">Dobit ćeš obavijest kada netko odgovori na tvoje objave</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 sm:p-4 rounded-lg border ${
                !notification.is_read
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              } hover:shadow-md transition-all cursor-pointer`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base">{notification.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
