'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateRelativeTime = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

      if (seconds < 5) {
        setRelativeTime('upravo sada');
      } else if (seconds < 60) {
        setRelativeTime(`prije ${seconds}s`);
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setRelativeTime(`prije ${minutes}min`);
      } else {
        setRelativeTime(lastSaved.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'Spremam...',
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'saved':
        return {
          icon: <Check className="w-3.5 h-3.5" />,
          text: lastSaved ? `Spremljeno ${relativeTime}` : 'Spremljeno',
          color: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <CloudOff className="w-3.5 h-3.5" />,
          text: 'Greška pri spremanju',
          color: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: <Cloud className="w-3.5 h-3.5" />,
          text: 'Nespremljeno',
          color: 'text-gray-500 dark:text-gray-400',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`flex items-center gap-1.5 text-xs ${display.color} transition-colors`}>
      {display.icon}
      <span className="hidden sm:inline">{display.text}</span>
    </div>
  );
}
