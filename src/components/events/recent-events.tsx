// src/components/events/recent-events.tsx
"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Images } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_LABELS, ROUTES } from "@/lib/constants";

interface RecentEventsProps {
  events: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    status: string;
    startDate?: Date | null;
    createdAt: Date;
    _count: { media: number };
  }>;
}

export function RecentEvents({ events }: RecentEventsProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
        <Link
          href={ROUTES.EVENTS}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          No events yet.{" "}
          <Link href={ROUTES.CREATE_EVENT} className="text-primary hover:underline">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {events.map((event) => (
            <Link
              key={event.id}
              href={ROUTES.EVENT(event.slug)}
              className="flex items-center gap-4 py-3 hover:bg-secondary/50 -mx-2 px-2 rounded-lg transition-colors group"
            >
              {/* Category icon */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                {EVENT_CATEGORY_ICONS[event.category as keyof typeof EVENT_CATEGORY_ICONS] ?? "📌"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {EVENT_CATEGORY_LABELS[event.category as keyof typeof EVENT_CATEGORY_LABELS]}
                  </span>
                  {event.startDate && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(event.startDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats & status */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={
                    event.status === "PUBLISHED"
                      ? "badge-published"
                      : event.status === "DRAFT"
                      ? "badge-draft"
                      : "badge-archived"
                  }
                >
                  {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Images className="w-3 h-3" />
                  {event._count.media}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
