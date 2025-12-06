'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ThumbsUp, Pin, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import type { Notification } from '@/types/notifications';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/app/notifications/actions';
import { useRouter } from 'next/navigation';

interface NotificationListProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationUpdate: (notifications: Notification[]) => void;
}

export function NotificationList({
  notifications,
  onClose,
  onNotificationUpdate,
}: NotificationListProps) {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply_to_topic':
      case 'reply_to_reply':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'upvote':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'topic_pinned':
        return <Pin className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      onNotificationUpdate(
        notifications.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }

    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    onNotificationUpdate(notifications.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    onNotificationUpdate(notifications.filter((n) => n.id !== notificationId));
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

  return (
    <Card className="w-full md:w-96 max-w-full md:max-w-md h-[100vh] md:h-auto max-h-[100vh] md:max-h-[600px] overflow-hidden shadow-lg">
      <div className="p-4 md:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Obavijesti</h3>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              title="Označi sve kao pročitano"
              className="h-9 px-3 md:h-auto md:px-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="ml-1.5 md:hidden text-xs">Sve</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 md:h-auto md:w-auto md:px-2"
            aria-label="Zatvori obavijesti"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-140px)] md:h-auto md:max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="p-8 md:p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-base">Nemaš novih obavijesti</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-sm line-clamp-2">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 w-8 p-0 md:h-7 md:w-7 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={(e) => handleDelete(e, notification.id)}
                        aria-label="Obriši obavijest"
                      >
                        <X className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </div>

                    {!notification.is_read && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Novo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 md:p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link href="/notifications" onClick={onClose}>
            <Button variant="ghost" size="sm" className="w-full h-10 md:h-auto text-sm font-medium">
              Vidi sve obavijesti
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
