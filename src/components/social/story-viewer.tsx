// src/components/social/story-viewer.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Plus, Camera } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Story {
  id: string;
  mediaId: string;
  caption?: string | null;
  durationSeconds: number;
  createdAt: Date;
  isSeen: boolean;
  author: { id: string; name: string; username: string; avatarUrl?: string | null };
  media: { originalUrl: string; thumbnailUrl?: string | null; type: string };
  event: { id: string; title: string; slug: string };
  _count: { views: number };
}

interface StoryBubble {
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorUsername: string;
  stories: Story[];
  hasUnseen: boolean;
}

interface StoryViewerProps {
  bubbles: StoryBubble[];
  canCreate?: boolean;
  onCreateStory?: () => void;
}

export function StoryBar({ bubbles, canCreate, onCreateStory }: StoryViewerProps) {
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  if (bubbles.length === 0 && !canCreate) return null;

  return (
    <>
      {/* Horizontal scroll bubble row */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
        {canCreate && (
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Add story</span>
          </button>
        )}

        {bubbles.map((bubble, idx) => (
          <button
            key={bubble.authorId}
            onClick={() => setActiveGroup(idx)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-full p-0.5",
              bubble.hasUnseen
                ? "bg-gradient-to-tr from-brand-500 to-brand-400"
                : "bg-secondary"
            )}>
              <div className="w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background">
                {bubble.authorAvatar ? (
                  <Image src={bubble.authorAvatar} alt={bubble.authorName} width={56} height={56} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-base font-semibold text-primary">
                    {bubble.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-foreground font-medium max-w-[56px] truncate">
              {bubble.authorUsername}
            </span>
          </button>
        ))}
      </div>

      {/* Full-screen story viewer */}
      {activeGroup !== null && (
        <StoryModal
          bubbles={bubbles}
          initialGroup={activeGroup}
          onClose={() => setActiveGroup(null)}
        />
      )}
    </>
  );
}

function StoryModal({
  bubbles,
  initialGroup,
  onClose,
}: {
  bubbles: StoryBubble[];
  initialGroup: number;
  onClose: () => void;
}) {
  const [groupIdx, setGroupIdx] = useState(initialGroup);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentGroup = bubbles[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];
  const duration = (currentStory?.durationSeconds ?? 5) * 1000;

  const next = useCallback(() => {
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < bubbles.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, currentGroup, bubbles.length, onClose]);

  const prev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(bubbles[groupIdx - 1].stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, groupIdx, bubbles]);

  // Auto-advance
  useEffect(() => {
    setProgress(0);
    const tick = 50;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (tick / duration) * 100;
      });
    }, tick);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [groupIdx, storyIdx, duration, next]);

  // Record view
  useEffect(() => {
    if (!currentStory) return;
    fetch(`/api/stories/${currentStory.id}/view`, { method: "POST" }).catch(() => {});
  }, [currentStory?.id]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Story card */}
      <div className="relative w-full max-w-sm h-full max-h-[700px] bg-black rounded-2xl overflow-hidden">

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-20 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
            {currentStory.author.avatarUrl ? (
              <Image src={currentStory.author.avatarUrl} alt={currentStory.author.name} width={32} height={32} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                {currentStory.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">{currentStory.author.name}</p>
            <p className="text-white/60 text-xs">{formatRelativeTime(currentStory.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="w-full h-full relative">
          <Image
            src={currentStory.media.originalUrl}
            alt={currentStory.caption ?? "Story"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-12 left-0 right-0 px-4 z-20">
            <p className="text-white text-sm font-medium text-shadow text-center drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Event label */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
          <Link
            href={`/events/${currentStory.event.slug}`}
            className="text-white/60 text-xs hover:text-white transition-colors"
          >
            {currentStory.event.title}
          </Link>
        </div>

        {/* Tap zones */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 w-1/3 h-full z-10 flex items-center pl-2"
        >
          {(storyIdx > 0 || groupIdx > 0) && (
            <ChevronLeft className="w-5 h-5 text-white/60" />
          )}
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-0 w-1/3 h-full z-10 flex items-center justify-end pr-2"
        >
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Close outside click */}
      <button className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
