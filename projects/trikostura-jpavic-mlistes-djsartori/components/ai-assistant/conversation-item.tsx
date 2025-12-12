'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteConversation } from '@/app/ai-assistant/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    updated_at: string;
  };
  isActive: boolean;
}

export function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteConversation(conversation.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Konverzacija obrisana');
        // Redirect to main page if deleting active conversation
        if (isActive) {
          router.push('/ai-assistant');
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      toast.error('Greška pri brisanju konverzacije');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="relative group">
      <Link
        href={`/ai-assistant?conversation=${conversation.id}`}
        className={`block p-3 rounded-lg transition-colors ${
          showConfirm
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
            : isActive
            ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {showConfirm ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Obrisati ovu konverzaciju?
                </p>
                <p className="text-xs text-red-500 dark:text-red-500">
                  Klikni ponovno za potvrdu
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(conversation.updated_at).toLocaleDateString('hr-HR')}
                </p>
              </>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex-shrink-0 p-1.5 rounded transition-colors ${
              showConfirm
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
            title={showConfirm ? 'Potvrdi brisanje' : 'Obriši konverzaciju'}
          >
            {showConfirm ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </Link>
    </div>
  );
}
