// src/components/media/media-gallery.tsx
"use client";

import { useState, useCallback } from "react";
import Masonry from "react-masonry-css";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { MediaCard } from "./media-card";
import { MediaLightbox } from "./media-lightbox";
import { cn } from "@/lib/utils";
import type { MediaWithRelations } from "@/lib/types/media";

interface MediaGalleryProps {
  media: MediaWithRelations[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  view?: "masonry" | "grid" | "list";
}

const BREAKPOINT_COLUMNS = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
};

const GRID_BREAKPOINT_COLUMNS = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
};

export function MediaGallery({
  media,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  view = "masonry",
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { ref: sentinelRef } = useIntersectionObserver({
    onIntersect: () => {
      if (hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    threshold: 0.1,
  });

  const handleOpenLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  if (media.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-3xl">📷</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No photos yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload photos to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {view === "masonry" ? (
        <Masonry
          breakpointCols={BREAKPOINT_COLUMNS}
          className="flex -ml-3 w-auto"
          columnClassName="pl-3 bg-clip-padding"
        >
          {media.map((item, index) => (
            <div key={item.id} className="mb-3">
              <MediaCard
                media={item}
                onDownload={() => handleDownload(item)}
              />
            </div>
          ))}
        </Masonry>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onDownload={() => handleDownload(item)}
              className="aspect-square"
            />
          ))}
        </div>
      ) : (
        // List view
        <div className="space-y-3">
          {media.map((item) => (
            <MediaListItem key={item.id} media={item} />
          ))}
        </div>
      )}

      {/* Skeleton loaders */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "skeleton rounded-xl",
                i % 3 === 0 ? "aspect-square" : i % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"
              )}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4 mt-4" />}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <MediaLightbox
          media={media}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function MediaListItem({ media }: { media: MediaWithRelations }) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl border border-border card-hover">
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {(media.thumbnailUrl ?? media.originalUrl) && (
          <img
            src={media.thumbnailUrl ?? media.originalUrl}
            alt={media.title ?? ""}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">
          {media.title ?? media.aiCaption ?? "Untitled"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          by {media.uploader.name}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>❤️ {media._count.likes}</span>
          <span>💬 {media._count.comments}</span>
          {media.aiTags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

async function handleDownload(media: MediaWithRelations) {
  try {
    const res = await fetch(`/api/media/${media.id}/download`);
    const data = await res.json();
    if (data.success) {
      const link = document.createElement("a");
      link.href = data.data.url;
      link.download = media.title ?? `photo-${media.id}`;
      link.click();
    }
  } catch (error) {
    console.error("Download failed:", error);
  }
}
