'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { MarkdownRenderer } from '@/components/forum/markdown-renderer';
import { MarkdownEditor } from '@/components/forum/markdown-editor';
import { AdvancedAttachmentList } from '@/components/forum/advanced-attachment-list';
import { ThumbsUp, ThumbsDown, MoreVertical, Edit2, Trash2, Quote, Link2, CheckCircle, Flag } from 'lucide-react';
import { ReportDialog } from './report-dialog';
import { createClient } from '@/lib/supabase/client';
import { editReply } from '@/app/forum/reply/actions';
import { deleteReplyAction, markSolutionAction } from '@/app/forum/actions';
import { toast } from 'sonner';
import { useButtonAnimation } from '@/hooks/use-button-animation';

interface ReplyCardProps {
  reply: any;
  userVote?: number;
  isLoggedIn: boolean;
  currentUserId?: string;
  isTopicAuthor?: boolean;
  onQuote?: (content: string, author: string) => void;
}

export const ReplyCard = memo(function ReplyCard({ reply, userVote, isLoggedIn, currentUserId, isTopicAuthor, onQuote }: ReplyCardProps) {
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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isSolution, setIsSolution] = useState(reply.is_solution);
  const router = useRouter();
  const { triggerAnimation: triggerUpvoteAnimation, animationClasses: upvoteAnimation } = useButtonAnimation();
  const { triggerAnimation: triggerDownvoteAnimation, animationClasses: downvoteAnimation } = useButtonAnimation();

  const isAuthor = currentUserId === reply.author_id;
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  const canMarkSolution = isTopicAuthor && !isSolution;

  async function handleVote(voteType: number) {
    if (!isLoggedIn) {
      toast.error('Morate biti prijavljeni da biste glasali');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    // Store previous state for rollback on error
    const previousVote = currentVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    // Optimistic update - update UI immediately
    if (currentVote === voteType) {
      // Removing vote
      setCurrentVote(undefined);
      if (voteType === 1) {
        setUpvotes(upvotes - 1);
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes - 1);
        triggerDownvoteAnimation();
      }
    } else if (currentVote) {
      // Changing vote
      if (voteType === 1) {
        setUpvotes(upvotes + 1);
        setDownvotes(downvotes - 1);
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes + 1);
        setUpvotes(upvotes - 1);
        triggerDownvoteAnimation();
      }
      setCurrentVote(voteType);
    } else {
      // New vote
      setCurrentVote(voteType);
      if (voteType === 1) {
        setUpvotes(upvotes + 1);
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes + 1);
        triggerDownvoteAnimation();
      }
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Niste prijavljeni');
      }

      // Perform database operation
      if (previousVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('reply_id', reply.id);

        if (error) throw error;

        // Remove upvote notification if it was an upvote
        if (voteType === 1 && reply.author_id !== user.id) {
          await (supabase as any)
            .from('notifications')
            .delete()
            .eq('user_id', reply.author_id)
            .eq('actor_id', user.id)
            .eq('reply_id', reply.id)
            .eq('type', 'upvote');
        }
      } else if (previousVote) {
        // Change vote
        const { error } = await (supabase as any)
          .from('votes')
          .update({ vote_type: voteType })
          .eq('user_id', user.id)
          .eq('reply_id', reply.id);

        if (error) throw error;

        // Handle notification changes
        if (reply.author_id !== user.id) {
          if (voteType === 1 && previousVote === -1) {
            // Changed from downvote to upvote - create notification
            await (supabase as any).from('notifications').insert({
              user_id: reply.author_id,
              actor_id: user.id,
              type: 'upvote',
              reply_id: reply.id,
              topic_id: reply.topic_id,
            });
          } else if (voteType === -1 && previousVote === 1) {
            // Changed from upvote to downvote - remove notification
            await (supabase as any)
              .from('notifications')
              .delete()
              .eq('user_id', reply.author_id)
              .eq('actor_id', user.id)
              .eq('reply_id', reply.id)
              .eq('type', 'upvote');
          }
        }
      } else {
        // New vote
        const { error } = await (supabase as any).from('votes').insert({
          user_id: user.id,
          reply_id: reply.id,
          vote_type: voteType,
        });

        if (error) throw error;

        // Create upvote notification (only for upvotes, and not for own replies)
        if (voteType === 1 && reply.author_id !== user.id) {
          await (supabase as any).from('notifications').insert({
            user_id: reply.author_id,
            actor_id: user.id,
            type: 'upvote',
            reply_id: reply.id,
            topic_id: reply.topic_id,
          });
        }
      }

      // Success feedback
      if (previousVote === voteType) {
        toast.success('Glas uklonjen');
      } else if (voteType === 1) {
        toast.success('👍 Sviđa ti se!');
      } else {
        toast.success('👎 Ne sviđa ti se');
      }
    } catch (error: any) {
      // Rollback optimistic update on error
      setCurrentVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);

      console.error('Voting error:', error);
      toast.error(error.message || 'Greška pri glasanju. Pokušajte ponovno.');
    } finally {
      setIsVoting(false);
    }
  }

  async function handleEdit() {
    if (!editContent.trim()) {
      toast.error('Sadržaj je obavezan');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Ažuriram odgovor...');

    try {
      const formData = new FormData();
      formData.append('replyId', reply.id);
      formData.append('content', editContent.trim());

      const result = await editReply(formData);

      if (result.success) {
        toast.success('Odgovor uspješno ažuriran!', { id: loadingToast });
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Došlo je do greške', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Došlo je do greške pri ažuriranju', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    const result = await deleteReplyAction(reply.id);

    if (result.success) {
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsDeleting(false);
  }

  async function handleMarkSolution() {
    const result = await markSolutionAction(reply.id, reply.topic_id);

    if (result.success) {
      setIsSolution(true);
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
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
      <Card id={`reply-${reply.id}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Uredi odgovor</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(reply.content);
                }}
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
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(reply.content);
                }}
                disabled={isSaving}
              >
                Odustani
              </Button>
              <Button onClick={handleEdit} disabled={isSaving || !editContent.trim()}>
                {isSaving ? 'Spremanje...' : 'Spremi'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={`reply-${reply.id}`} className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl ${isSolution ? 'ring-2 ring-green-500/20 bg-green-50/10 dark:bg-green-900/5' : ''}`}>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Mobile: Horizontal voting bar */}
          <div className="flex sm:hidden items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!isLoggedIn || isVoting}
              className={`h-8 px-3 rounded-lg transition-all ${
                currentVote === 1
                  ? 'border-green-500/30 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${isVoting ? 'opacity-50 cursor-wait' : ''} ${
                !isLoggedIn ? 'cursor-not-allowed' : ''
              } ${upvoteAnimation}`}
              title={!isLoggedIn ? 'Prijavite se da biste glasali' : 'Sviđa mi se'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 mr-1 ${isVoting ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {upvotes - downvotes}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!isLoggedIn || isVoting}
              className={`h-8 px-3 rounded-lg transition-all ${
                currentVote === -1
                  ? 'border-red-500/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${isVoting ? 'opacity-50 cursor-wait' : ''} ${
                !isLoggedIn ? 'cursor-not-allowed' : ''
              } ${downvoteAnimation}`}
              title={!isLoggedIn ? 'Prijavite se da biste glasali' : 'Ne sviđa mi se'}
            >
              <ThumbsDown className={`w-3.5 h-3.5 mr-1 ${isVoting ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{downvotes}</span>
            </Button>
          </div>

          {/* Desktop: Vertical voting bar */}
          <div className="hidden sm:flex flex-col items-center gap-2 bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!isLoggedIn || isVoting}
              className={`w-10 h-10 p-0 rounded-lg transition-all ${
                currentVote === 1
                  ? 'border-green-500/30 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${isVoting ? 'opacity-50 cursor-wait' : ''} ${
                !isLoggedIn ? 'cursor-not-allowed opacity-40' : ''
              } ${upvoteAnimation}`}
              title={!isLoggedIn ? 'Prijavite se da biste glasali' : 'Sviđa mi se'}
            >
              <ThumbsUp className={`w-4 h-4 ${isVoting ? 'animate-pulse' : ''}`} />
            </Button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white px-2 py-1">
              {upvotes - downvotes}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!isLoggedIn || isVoting}
              className={`w-10 h-10 p-0 rounded-lg transition-all ${
                currentVote === -1
                  ? 'border-red-500/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${isVoting ? 'opacity-50 cursor-wait' : ''} ${
                !isLoggedIn ? 'cursor-not-allowed opacity-40' : ''
              } ${downvoteAnimation}`}
              title={!isLoggedIn ? 'Prijavite se da biste glasali' : 'Ne sviđa mi se'}
            >
              <ThumbsDown className={`w-4 h-4 ${isVoting ? 'animate-pulse' : ''}`} />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Link href={`/forum/user/${reply.author?.username}`} className="flex-shrink-0 transition-transform hover:scale-110">
                  <Avatar
                    src={reply.author?.avatar_url}
                    alt={reply.author?.username || 'User'}
                    username={reply.author?.username}
                    size="sm"
                  />
                </Link>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/forum/user/${reply.author?.username}`}
                      className="font-bold text-sm sm:text-base text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {reply.author?.username}
                    </Link>
                    {reply.author?.reputation > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-700 dark:text-yellow-300 rounded-full font-bold shadow-sm ring-1 ring-yellow-500/20">
                        ⭐ {reply.author.reputation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {new Date(reply.created_at).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {reply.edited_at && (
                      <span className="italic text-gray-500" title={`Uređeno: ${new Date(reply.edited_at).toLocaleString('hr-HR')}`}>
                        • (uređeno)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isLoggedIn && (
                <div className="relative flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActions(!showActions)}
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>

                  {showActions && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-20 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="py-1">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                          >
                            <Edit2 className="w-4 h-4" />
                            Uredi
                          </button>
                        )}
                        {canMarkSolution && (
                          <button
                            onClick={() => {
                              handleMarkSolution();
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Označi kao rješenje
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleQuote();
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <Quote className="w-4 h-4" />
                          Citiraj
                        </button>
                        <button
                          onClick={() => {
                            handleShare();
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <Link2 className="w-4 h-4" />
                          Kopiraj link
                        </button>
                        {canDelete && (
                          <>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowActions(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Obriši
                            </button>
                          </>
                        )}
                        {!isAuthor && (
                          <>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                            <button
                              onClick={() => {
                                setShowReportDialog(true);
                                setShowActions(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-orange-600"
                            >
                              <Flag className="w-4 h-4" />
                              Prijavi
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-sm sm:text-base">
              <MarkdownRenderer content={reply.content} />
            </div>
            <AdvancedAttachmentList attachments={reply.attachments || []} />

            {isSolution && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold ring-1 ring-green-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CheckCircle className="w-4 h-4" />
                <span>Označeno kao rješenje</span>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Jeste li sigurni da želite obrisati ovaj odgovor?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Brisanje...' : 'Da, obriši'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Odustani
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {showReportDialog && (
        <ReportDialog
          replyId={reply.id}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </Card>
  );
});
