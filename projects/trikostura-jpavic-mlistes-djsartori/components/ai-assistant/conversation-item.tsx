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
          isActive
            ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{conversation.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(conversation.updated_at).toLocaleDateString('hr-HR')}
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              showConfirm
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
            title={showConfirm ? 'Klikni ponovno za potvrdu' : 'Obriši konverzaciju'}
          >
            {showConfirm ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </Link>

      {/* Confirmation tooltip */}
      {showConfirm && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400 z-10">
          Klikni ponovno za potvrdu brisanja
        </div>
      )}
    </div>
  );
}
