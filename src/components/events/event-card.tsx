// src/components/events/event-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Images, MapPin, Lock, Users, Globe } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, ROUTES } from "@/lib/constants";
import type { Event } from "@/lib/types/event";

interface EventCardProps {
  event: Event & { _count?: { media: number; albums: number } };
  className?: string;
}

const ACCESS_ICONS = {
  PUBLIC: Globe,
  MEMBERS_ONLY: Users,
  PRIVATE: Lock,
};

const STATUS_CLASSES = {
  PUBLISHED: "badge-published",
  DRAFT: "badge-draft",
  ARCHIVED: "badge-archived",
};

export function EventCard({ event, className }: EventCardProps) {
  const AccessIcon = ACCESS_ICONS[event.accessLevel];
  const categoryEmoji = EVENT_CATEGORY_ICONS[event.category] ?? "📌";
  const categoryLabel = EVENT_CATEGORY_LABELS[event.category] ?? event.category;

  return (
    <Link
      href={ROUTES.EVENT(event.slug)}
      className={cn(
        "group flex flex-col bg-card rounded-2xl border border-border overflow-hidden",
        "card-hover",
        className
      )}
    >
      {/* Cover image */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-brand-900/40 flex items-center justify-center">
            <span className="text-5xl opacity-60">{categoryEmoji}</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={STATUS_CLASSES[event.status]}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Access level */}
        <div className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <AccessIcon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{categoryEmoji}</span>
          <span className="text-xs font-medium text-muted-foreground">{categoryLabel}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Meta info */}
        <div className="flex flex-col gap-1.5 mt-auto">
          {event.startDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDate(event.startDate)}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Owner */}
          {event.owner && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                {event.owner.avatarUrl ? (
                  <Image
                    src={event.owner.avatarUrl}
                    alt={event.owner.name}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20" />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {event.owner.name}
              </span>
            </div>
          )}

          {/* Stats */}
          {event._count && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Images className="w-3.5 h-3.5" />
              <span>{event._count.media} photos</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
