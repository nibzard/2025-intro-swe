'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ThumbsUp, Pin, X, CheckCheck, Bell } from 'lucide-react';
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
        return <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'upvote':
        return <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'topic_pinned':
        return <Pin className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
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
    <Card className="w-full md:w-[420px] max-w-full md:max-w-md h-[100vh] md:h-auto max-h-[100vh] md:max-h-[600px] overflow-hidden shadow-xl md:shadow-2xl border-gray-200 dark:border-gray-700 md:animate-slide-down">
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850">
        <div className="flex items-center gap-2">
          <div className="hidden md:block p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white">Obavijesti</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {notifications.some((n) => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              title="Označi sve kao pročitano"
              className="h-9 px-3 md:h-9 md:px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="ml-1.5 md:inline text-xs font-medium">Sve</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
            aria-label="Zatvori obavijesti"
          >
            <X className="w-5 h-5 md:w-4.5 md:h-4.5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-140px)] md:h-auto md:max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="p-12 md:p-16 text-center text-gray-500">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-6">
                <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">Nemaš novih obavijesti</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bit ćeš obaviješten kada netko odgovori</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative p-4 md:p-4 cursor-pointer transition-all duration-200 ${
                  !notification.is_read
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                } active:bg-gray-100 dark:active:bg-gray-700`}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                )}

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-white dark:bg-gray-700/50 shadow-sm group-hover:shadow-md transition-shadow">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {!notification.is_read && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Novo</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all rounded-lg"
                        onClick={(e) => handleDelete(e, notification.id)}
                        aria-label="Obriši obavijest"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          <Link href="/notifications" onClick={onClose}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Vidi sve obavijesti →
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
