'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingAssistantButtonProps {
  /** Whether to show the button (default: true) */
  show?: boolean;
}

export function FloatingAssistantButton({ show = true }: FloatingAssistantButtonProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the button
    const dismissed = localStorage.getItem('ai-assistant-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ai-assistant-dismissed', 'true');
  };

  if (!show || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Tooltip */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-bounce">
        <p className="text-sm font-medium">Trebate pomoć pri učenju?</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Isprobajte AI asistenta</p>
      </div>

      {/* Button Container */}
      <div className="relative">
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
          title="Zatvori"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Main Button */}
        <Link href="/ai-assistant">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full w-14 h-14 sm:w-16 sm:h-16 p-0 flex items-center justify-center"
          >
            <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
          </Button>
        </Link>

        {/* Pulse Animation Ring */}
        <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20 pointer-events-none" />
      </div>
    </div>
  );
}
