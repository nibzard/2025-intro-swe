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
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes - 1);
        triggerDownvoteAnimation();
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
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes + 1);
        setUpvotes(upvotes - 1);
        triggerDownvoteAnimation();
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
        triggerUpvoteAnimation();
      } else {
        setDownvotes(downvotes + 1);
        triggerDownvoteAnimation();
      }
    }

    setIsVoting(false);
    router.refresh();
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
    <Card id={`reply-${reply.id}`}>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Mobile: Horizontal voting bar */}
          <div className="flex sm:hidden items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <Button
              variant={currentVote === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!isLoggedIn || isVoting}
              className={`h-8 px-3 ${upvoteAnimation}`}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              <span className="text-sm">{upvotes}</span>
            </Button>
            <span className="text-base font-semibold">
              {upvotes - downvotes}
            </span>
            <Button
              variant={currentVote === -1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!isLoggedIn || isVoting}
              className={`h-8 px-3 ${downvoteAnimation}`}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1" />
              <span className="text-sm">{downvotes}</span>
            </Button>
          </div>

          {/* Desktop: Vertical voting bar */}
          <div className="hidden sm:flex flex-col items-center gap-2">
            <Button
              variant={currentVote === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(1)}
              disabled={!isLoggedIn || isVoting}
              className={`w-10 h-10 p-0 ${upvoteAnimation}`}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold">
              {upvotes - downvotes}
            </span>
            <Button
              variant={currentVote === -1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={!isLoggedIn || isVoting}
              className={`w-10 h-10 p-0 ${downvoteAnimation}`}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Link href={`/forum/user/${reply.author?.username}`} className="flex-shrink-0">
                  <Avatar
                    src={reply.author?.avatar_url}
                    alt={reply.author?.username || 'User'}
                    username={reply.author?.username}
                    size="sm"
                  />
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                  <Link
                    href={`/forum/user/${reply.author?.username}`}
                    className="font-semibold text-sm sm:text-base truncate hover:underline"
                  >
                    {reply.author?.username}
                  </Link>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date(reply.created_at).toLocaleDateString('hr-HR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {reply.edited_at && (
                    <span className="text-xs text-gray-400 italic" title={`Uređeno: ${new Date(reply.edited_at).toLocaleString('hr-HR')}`}>
                      (uređeno)
                    </span>
                  )}
                  {reply.author?.reputation > 0 && (
                    <span className="text-xs px-2 py-0.5 sm:py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                      {reply.author.reputation} rep
                    </span>
                  )}
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
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
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
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Quote className="w-4 h-4" />
                          Citiraj
                        </button>
                        <button
                          onClick={() => {
                            handleShare();
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          Kopiraj link
                        </button>
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
                              Obriši
                            </button>
                          </>
                        )}
                        {!isAuthor && (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <button
                              onClick={() => {
                                setShowReportDialog(true);
                                setShowActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
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
              <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs sm:text-sm font-medium">
                ✓ Označeno kao rješenje
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
