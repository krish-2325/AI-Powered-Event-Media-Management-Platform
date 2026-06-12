// src/components/media/gallery-client.tsx
"use client";

import { useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LayoutGrid, Rows, LayoutList, Search, SlidersHorizontal } from "lucide-react";
import { MediaGallery } from "./media-gallery";
import { cn } from "@/lib/utils";
import type { MediaWithRelations } from "@/lib/types/media";

interface GalleryClientProps {
  initialMedia: MediaWithRelations[];
}

type GalleryView = "masonry" | "grid" | "list";

const VIEW_ICONS = {
  masonry: LayoutGrid,
  grid: Rows,
  list: LayoutList,
};

async function fetchMedia(page: number): Promise<{ media: MediaWithRelations[]; hasMore: boolean }> {
  const res = await fetch(`/api/media?page=${page}&limit=30`);
  const json = await res.json();
  return {
    media: json.data?.media ?? [],
    hasMore: json.data?.pagination?.hasNextPage ?? false,
  };
}

export function GalleryClient({ initialMedia }: GalleryClientProps) {
  const [view, setView] = useState<GalleryView>("masonry");
  const [search, setSearch] = useState("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["gallery"],
    queryFn: ({ pageParam = 1 }) => fetchMedia(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    initialData: {
      pages: [{ media: initialMedia, hasMore: true }],
      pageParams: [1],
    },
  });

  const allMedia = data?.pages.flatMap((p) => p.media) ?? [];

  const filteredMedia = search
    ? allMedia.filter(
        (m) =>
          m.aiTags.some((t) => t.includes(search.toLowerCase())) ||
          m.title?.toLowerCase().includes(search.toLowerCase()) ||
          m.aiCaption?.toLowerCase().includes(search.toLowerCase())
      )
    : allMedia;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by tag, caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {(["masonry", "grid", "list"] as GalleryView[]).map((v) => {
            const Icon = VIEW_ICONS[v];
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                title={v.charAt(0).toUpperCase() + v.slice(1)}
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                  view === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery */}
      <MediaGallery
        media={filteredMedia}
        view={view}
        onLoadMore={handleLoadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
