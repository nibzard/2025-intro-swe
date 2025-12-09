'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit2, Trash2, Pin, Lock, Unlock, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { deleteTopicAction } from '@/app/forum/actions';

interface TopicControlMenuProps {
  topic: any;
  isAuthor: boolean;
  isAdmin: boolean;
  categories?: any[];
}

export function TopicControlMenu({ topic, isAuthor, isAdmin, categories = [] }: TopicControlMenuProps) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveCategory, setShowMoveCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(topic.category_id);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const canEdit = isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin;
  const canPin = isAdmin;
  const canLock = isAdmin;
  const canMove = isAdmin;

  async function handleDelete() {
    setIsProcessing(true);

    const result = await deleteTopicAction(topic.id);

    if (result.success) {
      router.push('/forum');
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
      setIsProcessing(false);
    }
  }

  async function handleTogglePin() {
    setIsProcessing(true);
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('topics')
      .update({ is_pinned: !topic.is_pinned })
      .eq('id', topic.id);

    if (!error) {
      router.refresh();
    }
    setIsProcessing(false);
    setShowActions(false);
  }

  async function handleToggleLock() {
    setIsProcessing(true);
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('topics')
      .update({ is_locked: !topic.is_locked })
      .eq('id', topic.id);

    if (!error) {
      router.refresh();
    }
    setIsProcessing(false);
    setShowActions(false);
  }

  async function handleMoveCategory() {
    setIsProcessing(true);
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('topics')
      .update({ category_id: selectedCategory })
      .eq('id', topic.id);

    if (!error) {
      router.refresh();
    }
    setIsProcessing(false);
    setShowMoveCategory(false);
    setShowActions(false);
  }

  if (!canEdit && !canDelete && !canPin && !canLock && !canMove) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowActions(!showActions)}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {showActions && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="py-1">
            {canEdit && (
              <button
                onClick={() => {
                  router.push(`/forum/edit/${topic.slug}`);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Uredi temu
              </button>
            )}
            {canPin && (
              <button
                onClick={handleTogglePin}
                disabled={isProcessing}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
              >
                <Pin className="w-4 h-4" />
                {topic.is_pinned ? 'Otkvači temu' : 'Prikvači temu'}
              </button>
            )}
            {canLock && (
              <button
                onClick={handleToggleLock}
                disabled={isProcessing}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
              >
                {topic.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {topic.is_locked ? 'Otključaj temu' : 'Zaključaj temu'}
              </button>
            )}
            {canMove && (
              <button
                onClick={() => {
                  setShowMoveCategory(true);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Premjesti temu
              </button>
            )}
            {canDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Obriši temu
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Obriši temu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Jeste li sigurni da želite obrisati ovu temu? Ova radnja će obrisati temu i sve odgovore.
              Ovo se ne može poništiti.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
              >
                Odustani
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isProcessing}
              >
                {isProcessing ? 'Brisanje...' : 'Da, obriši'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showMoveCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Premjesti temu</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Odaberi kategoriju:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMoveCategory(false)}
                disabled={isProcessing}
              >
                Odustani
              </Button>
              <Button
                onClick={handleMoveCategory}
                disabled={isProcessing}
              >
                {isProcessing ? 'Premještanje...' : 'Premjesti'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
