'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import { MarkdownEditor } from '@/components/forum/markdown-editor';
import { AdvancedAttachmentList } from '@/components/forum/advanced-attachment-list';
import { ThumbsUp, ThumbsDown, MoreVertical, Edit2, Trash2, Quote, Link2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ReplyCardProps {
  reply: any;
  userVote?: number;
  isLoggedIn: boolean;
  currentUserId?: string;
  isTopicAuthor?: boolean;
  onQuote?: (content: string, author: string) => void;
}

export function ReplyCard({ reply, userVote, isLoggedIn, currentUserId, isTopicAuthor, onQuote }: ReplyCardProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [upvotes, setUpvotes] = useState(reply.upvotes);
  const [downvotes, setDownvotes] = useState(reply.downvotes);
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSolution, setIsSolution] = useState(reply.is_solution);
  const router = useRouter();

  const isAuthor = currentUserId === reply.author_id;
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  const canMarkSolution = isTopicAuthor && !isSolution;

  async function handleVote(voteType: number) {
    if (!isLoggedIn || isVoting) return;

    setIsVoting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsVoting(false);
      return;
    }

    // If user is clicking the same vote, remove it
    if (currentVote === voteType) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('reply_id', reply.id);

      setCurrentVote(undefined);
      if (voteType === 1) {
        setUpvotes(upvotes - 1);
      } else {
        setDownvotes(downvotes - 1);
      }
    }
    // If user is changing vote
    else if (currentVote) {
      await (supabase as any)
        .from('votes')
        .update({ vote_type: voteType })
        .eq('user_id', user.id)
        .eq('reply_id', reply.id);

      if (voteType === 1) {
        setUpvotes(upvotes + 1);
        setDownvotes(downvotes - 1);
      } else {
        setDownvotes(downvotes + 1);
        setUpvotes(upvotes - 1);
      }
      setCurrentVote(voteType);
    }
    // New vote
    else {
      await (supabase as any).from('votes').insert({
        user_id: user.id,
        reply_id: reply.id,
        vote_type: voteType,
      });

      setCurrentVote(voteType);
      if (voteType === 1) {
        setUpvotes(upvotes + 1);
      } else {
        setDownvotes(downvotes + 1);
      }
    }

    setIsVoting(false);
    router.refresh();
  }

  async function handleEdit() {
    if (!editContent.trim()) return;

    setIsSaving(true);
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('replies')
      .update({
        content: editContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reply.id);

    if (!error) {
      setIsEditing(false);
      router.refresh();
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('replies')
      .delete()
      .eq('id', reply.id);

    if (!error) {
      router.refresh();
    }
    setIsDeleting(false);
  }

  async function handleMarkSolution() {
    const supabase = createClient();

    const { error } = await (supabase as any)
      .from('replies')
      .update({ is_solution: true })
      .eq('id', reply.id);

    if (!error) {
      setIsSolution(true);
      router.refresh();
    }
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#reply-${reply.id}`;
    navigator.clipboard.writeText(url);
    alert('Link kopiran u clipboard!');
  }

  function handleQuote() {
    if (onQuote) {
      onQuote(reply.content, reply.author?.username || 'Unknown');
    }
  }

  if (isEditing) {
    return (
      <div id={`reply-${reply.id}`} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Edit2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Uredi odgovor</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(reply.content);
              }}
              className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Odustani
            </Button>
          </div>
          <MarkdownEditor
            value={editContent}
            onChange={setEditContent}
            placeholder="Uredi svoj odgovor..."
            rows={6}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditContent(reply.content);
              }}
              disabled={isSaving}
              className="px-6 py-2 font-semibold"
            >
              Odustani
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSaving || !editContent.trim()}
              className="px-6 py-2 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? 'Spremanje...' : 'Spremi promjene'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={`reply-${reply.id}`} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 p-6">
      <div className="flex gap-6">
        {/* Voting Section */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant={currentVote === 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVote(1)}
            disabled={!isLoggedIn || isVoting}
            className="w-12 h-12 p-0 rounded-xl hover:scale-110 transition-transform duration-200"
          >
            <ThumbsUp className="w-5 h-5" />
          </Button>
          <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
            upvotes - downvotes > 0
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : upvotes - downvotes < 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {upvotes - downvotes}
          </div>
          <Button
            variant={currentVote === -1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVote(-1)}
            disabled={!isLoggedIn || isVoting}
            className="w-12 h-12 p-0 rounded-xl hover:scale-110 transition-transform duration-200"
          >
            <ThumbsDown className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Author info and actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {reply.author?.username}
              </span>
              {reply.author?.reputation > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold">
                  ⭐ {reply.author.reputation} rep
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(reply.created_at).toLocaleDateString('hr-HR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {reply.updated_at && reply.created_at !== reply.updated_at && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  📝 uređeno
                </span>
              )}
            </div>

            {isLoggedIn && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden">
                    <div className="py-2">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                          <span className="font-medium">Uredi</span>
                        </button>
                      )}
                      {canMarkSolution && (
                        <button
                          onClick={() => {
                            handleMarkSolution();
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 text-green-600 dark:text-green-400 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Označi kao rješenje</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleQuote();
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <Quote className="w-5 h-5" />
                        <span className="font-medium">Citiraj</span>
                      </button>
                      <button
                        onClick={() => {
                          handleShare();
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <Link2 className="w-5 h-5" />
                        <span className="font-medium">Kopiraj link</span>
                      </button>
                      {canDelete && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="font-medium">Obriši</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply content */}
          <div className="prose prose-lg max-w-none dark:prose-invert mb-4">
            <MarkdownRenderer content={reply.content} />
          </div>
          <AdvancedAttachmentList attachments={reply.attachments || []} />

          {/* Solution badge */}
          {isSolution && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 rounded-xl text-sm font-bold shadow-lg">
              <CheckCircle className="w-5 h-5" />
              ✓ Označeno kao rješenje
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-base text-red-800 dark:text-red-200 mb-4 font-medium">
                Jeste li sigurni da želite obrisati ovaj odgovor?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-6 py-2 font-semibold"
                >
                  {isDeleting ? 'Brisanje...' : 'Da, obriši'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-2 font-semibold"
                >
                  Odustani
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
