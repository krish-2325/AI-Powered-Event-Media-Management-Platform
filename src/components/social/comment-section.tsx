// src/components/social/comment-section.tsx
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { mediaApi } from "@/lib/api/client";
import type { Comment } from "@/lib/types/media";

interface CommentSectionProps {
  mediaId: string;
  initialComments?: Comment[];
}

export function CommentSection({ mediaId, initialComments = [] }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, parentId?: string) => {
      e.preventDefault();
      if (!newComment.trim() || !session?.user) return;

      setIsSubmitting(true);
      try {
        const res = await mediaApi.addComment(mediaId, newComment.trim(), parentId);
        if (res.data) {
          if (parentId) {
            setComments((prev) =>
              prev.map((c) =>
                c.id === parentId
                  ? { ...c, replies: [...(c.replies ?? []), res.data!] }
                  : c
              )
            );
            setReplyingTo(null);
          } else {
            setComments((prev) => [res.data!, ...prev]);
          }
          setNewComment("");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [mediaId, newComment, session]
  );

  return (
    <div id="comments" className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      {session?.user ? (
        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden">
            {session.user.avatarUrl ? (
              <Image src={session.user.avatarUrl} alt={session.user.name} width={32} height={32} className="object-cover" />
            ) : (
              session.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              className="w-full pr-10 pl-4 py-2 rounded-full border border-border bg-secondary text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:opacity-40 hover:text-primary/80 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link> to comment
        </p>
      )}

      {/* Comment list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyingTo(id)}
              replyingTo={replyingTo}
              onReplySubmit={(e, parentId) => handleSubmit(e, parentId)}
              newReply={newComment}
              onNewReplyChange={setNewComment}
              isSubmitting={isSubmitting}
              session={session}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: (id: string) => void;
  replyingTo: string | null;
  onReplySubmit: (e: React.FormEvent, parentId: string) => void;
  newReply: string;
  onNewReplyChange: (val: string) => void;
  isSubmitting: boolean;
  session: any;
}

function CommentItem({
  comment,
  onReply,
  replyingTo,
  onReplySubmit,
  newReply,
  onNewReplyChange,
  isSubmitting,
  session,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = comment.replies ?? [];

  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.user.username}`} className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-xs font-semibold text-primary">
          {comment.user.avatarUrl ? (
            <Image src={comment.user.avatarUrl} alt={comment.user.name} width={32} height={32} className="object-cover" />
          ) : (
            comment.user.name.charAt(0).toUpperCase()
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl px-4 py-2.5">
          <Link href={`/profile/${comment.user.username}`} className="text-xs font-semibold text-foreground hover:text-primary transition-colors">
            {comment.user.name}
          </Link>
          <p className="text-sm text-foreground mt-0.5 leading-snug">{comment.content}</p>
        </div>

        <div className="flex items-center gap-4 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {session?.user && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Reply
            </button>
          )}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform", showReplies && "rotate-180")} />
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && session?.user && (
          <form
            onSubmit={(e) => onReplySubmit(e, comment.id)}
            className="flex gap-2 mt-2 ml-2"
          >
            <input
              type="text"
              value={newReply}
              onChange={(e) => onNewReplyChange(e.target.value)}
              placeholder={`Reply to ${comment.user.name}…`}
              autoFocus
              className="flex-1 pr-8 pl-3 py-1.5 rounded-full border border-border bg-secondary text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!newReply.trim() || isSubmitting}
              className="text-primary disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary">
                  {reply.user.avatarUrl ? (
                    <Image src={reply.user.avatarUrl} alt={reply.user.name} width={24} height={24} className="object-cover" />
                  ) : reply.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-secondary rounded-2xl px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">{reply.user.name} </span>
                    <span className="text-xs text-foreground">{reply.content}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 px-2">
                    {formatRelativeTime(reply.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
