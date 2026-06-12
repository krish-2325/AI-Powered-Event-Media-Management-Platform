// src/app/search/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { EventCard } from "@/components/events/event-card";
import { MediaCard } from "@/components/media/media-card";
import { SearchClient } from "@/components/search-client";
import { SearchFilters } from "@/components/search-filters";
import { Suspense } from "react";

export const metadata = { title: "Search" };

interface Props {
  searchParams: { q?: string; type?: "all" | "events" | "media" | "people"; category?: string; startDate?: string; endDate?: string };
}

async function performSearch(q: string, userId?: string, category?: string, startDate?: string, endDate?: string) {
  const accessFilter = userId
    ? { accessLevel: { in: ["PUBLIC", "MEMBERS_ONLY"] as const } }
    : { accessLevel: "PUBLIC" as const };

  const textFilter = {
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [events, media, users] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED", ...accessFilter, ...textFilter,
        ...(category && { category }),
        ...(startDate && { startDate: { gte: new Date(startDate) } }),
        ...(endDate && { endDate: { lte: new Date(endDate + "T23:59:59Z") } }),
      },
      take: 6,
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { media: true, albums: true } },
      },
    }),
    prisma.media.findMany({
      where: {
        ...accessFilter,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { aiCaption: { contains: q, mode: "insensitive" } },
          { aiTags: { hasSome: [q.toLowerCase()] } },
        ],
      },
      take: 12,
      include: {
        uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, name: true, username: true, avatarUrl: true, role: true, bio: true },
    }),
  ]);

  return { events, media, users };
}

export default async function SearchPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const q = searchParams.q ?? "";

  const results = q ? await performSearch(
    q,
    session?.user?.id,
    searchParams.category,
    searchParams.startDate,
    searchParams.endDate
  ) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        {q && results && (
          <p className="page-description">
            Results for &quot;{q}&quot;
          </p>
        )}
      </div>

      <Suspense fallback={null}><SearchFilters /></Suspense>
      <SearchClient
        query={q}
        events={(results?.events ?? []) as any}
        media={(results?.media ?? []) as any}
        users={results?.users ?? []}
      />
    </div>
  );
}
