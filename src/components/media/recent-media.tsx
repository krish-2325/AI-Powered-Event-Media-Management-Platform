// src/components/media/recent-media.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface RecentMediaProps {
  media: Array<{
    id: string;
    originalUrl: string;
    thumbnailUrl?: string | null;
    title?: string | null;
    aiCaption?: string | null;
    createdAt: Date;
    _count: { likes: number; comments: number };
  }>;
}

export function RecentMedia({ media }: RecentMediaProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">Recent Uploads</h2>
        <Link
          href="/gallery"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {media.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          No uploads yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {media.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href={`/media/${item.id}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
            >
              {(item.thumbnailUrl ?? item.originalUrl) && (
                <Image
                  src={item.thumbnailUrl ?? item.originalUrl}
                  alt={item.title ?? item.aiCaption ?? ""}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="150px"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <div className="flex items-center gap-2 text-xs text-white">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {item._count.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {item._count.comments}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
