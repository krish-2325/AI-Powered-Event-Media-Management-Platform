// src/components/media/media-card.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Download, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { MediaWithRelations } from "@/lib/types/media";

interface MediaCardProps {
  media: MediaWithRelations;
  onLike?: (mediaId: string) => void;
  onFavorite?: (mediaId: string) => void;
  onDownload?: (mediaId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function MediaCard({
  media,
  onLike,
  onFavorite,
  onDownload,
  showActions = true,
  className,
}: MediaCardProps) {
  const [isLiked, setIsLiked] = useState(media.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(media._count.likes);
  const [isFavorited, setIsFavorited] = useState(media.isFavorited ?? false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/media/${media.id}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsLiked(data.data.liked);
        setLikeCount(data.data.count);
      }
    } catch {
      // Revert optimistic update
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }

    onLike?.(media.id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((prev) => !prev);
    onFavorite?.(media.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/media/${media.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "link" }),
      });
      const data = await res.json();
      if (data.success) {
        await navigator.clipboard.writeText(data.data.shareUrl).catch(() => {});
      }
    } catch {}
  };

  const aspectRatio =
    media.width && media.height
      ? Math.min(Math.max(media.height / media.width, 0.5), 1.5)
      : 0.75;

  return (
    <div
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden border border-border",
        "card-hover",
        className
      )}
    >
      {/* Image */}
      <Link href={`/media/${media.id}`} className="block relative overflow-hidden">
        <div style={{ paddingBottom: `${aspectRatio * 100}%` }} className="relative">
          {media.thumbnailUrl || media.originalUrl ? (
            <Image
              src={media.thumbnailUrl ?? media.originalUrl}
              alt={media.title ?? media.aiCaption ?? "Media"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              placeholder={media.blurHash ? "blur" : "empty"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Video indicator */}
          {media.type === "VIDEO" && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              ▶ Video
            </div>
          )}

          {/* Hover overlay */}
          {showActions && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
              <div className="flex items-center gap-3 w-full">
                {/* Like */}
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    "text-white/90 hover:text-white transition-colors",
                    isLiked && "text-rose-400 hover:text-rose-300"
                  )}
                >
                  <Heart
                    className={cn("w-4 h-4", isLiked && "fill-current")}
                  />
                  <span>{formatNumber(likeCount)}</span>
                </button>

                {/* Comments */}
                <Link
                  href={`/media/${media.id}#comments`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{formatNumber(media._count.comments)}</span>
                </Link>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Favorite */}
                <button
                  onClick={handleFavorite}
                  className={cn(
                    "text-white/90 hover:text-white transition-colors",
                    isFavorited && "text-amber-400 hover:text-amber-300"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", isFavorited && "fill-current")} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="text-white/90 hover:text-white transition-colors"
                  title="Copy link"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDownload?.(media.id);
                  }}
                  className="text-white/90 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Meta */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${media.uploader.username}`}>
            <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
              {media.uploader.avatarUrl ? (
                <Image
                  src={media.uploader.avatarUrl}
                  alt={media.uploader.name}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20" />
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${media.uploader.username}`}
              className="text-xs font-medium text-foreground hover:text-primary truncate block"
            >
              {media.uploader.name}
            </Link>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatRelativeTime(media.createdAt)}
          </span>
        </div>

        {/* AI Tags */}
        {media.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {media.aiTags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${tag}`}
                className="tag-pill hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
