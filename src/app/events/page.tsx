// src/app/events/page.tsx

import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { EventSortControl } from "@/components/events/event-sort-control";
import { hasRole } from "@/lib/auth/helpers";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Events" };

interface SearchParams {
  category?: string;
  q?: string;
  page?: string;
}

async function getEvents(searchParams: SearchParams, userId?: string, userRole?: UserRole) {
  const page = Number(searchParams.page ?? 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const accessFilter = userId
    ? { accessLevel: { in: ["PUBLIC", "MEMBERS_ONLY"] as const } }
    : { accessLevel: "PUBLIC" as const };

  const where = {
    status: "PUBLISHED",
    ...accessFilter,
    ...(searchParams.category && { category: searchParams.category }),
    ...(searchParams.q && {
      OR: [
        { title: { contains: searchParams.q, mode: "insensitive" as const } },
        { description: { contains: searchParams.q, mode: "insensitive" as const } },
        { location: { contains: searchParams.q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { media: true, albums: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canCreate = userRole && hasRole(userRole, "CLUB_MEMBER");

  const { events, total, page, totalPages } = await getEvents(
    searchParams,
    session?.user?.id,
    userRole
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="page-header mb-0">
          <h1 className="page-title">Events</h1>
          <p className="page-description">{total} events found</p>
        </div>
        {canCreate && (
          <Link
            href={ROUTES.CREATE_EVENT}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Link>
        )}
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <Suspense fallback={null}>
          <EventFilters />
        </Suspense>
        <Suspense fallback={null}>
          <EventSortControl />
        </Suspense>
      </div>

      {/* Grid */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🎭</span>
          <h3 className="text-lg font-semibold text-foreground mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or{" "}
            {canCreate && (
              <Link href={ROUTES.CREATE_EVENT} className="text-primary hover:underline">
                create the first one
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`${ROUTES.EVENTS}?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
