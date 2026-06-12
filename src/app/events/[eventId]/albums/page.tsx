// src/app/events/[eventId]/albums/page.tsx

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { AlbumsClient } from "@/components/events/albums-client";
import { canAccessContent } from "@/lib/auth/helpers";
import type { AccessLevel } from "@/lib/types/event";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Albums" };

interface Props { params: { eventId: string } }

export default async function AlbumsPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  const event = await prisma.event.findFirst({
    where: { OR: [{ slug: params.eventId }, { id: params.eventId }] },
    include: {
      albums: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { media: true } },
          media: {
            take: 1,
            select: { thumbnailUrl: true, originalUrl: true },
          },
        },
      },
      _count: { select: { media: true } },
    },
  });

  if (!event) notFound();

  const userRole = session?.user?.role as UserRole | undefined;
  const isOwner = session?.user?.id === event.ownerId;

  if (!canAccessContent(userRole, event.accessLevel as AccessLevel, isOwner)) {
    notFound();
  }

  const canManage =
    isOwner ||
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "PHOTOGRAPHER";

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="text-sm text-muted-foreground">
          <a href={`/events/${event.slug}`} className="hover:text-primary transition-colors">
            {event.title}
          </a>
          {" / "}Albums
        </p>
        <h1 className="page-title">Albums</h1>
        <p className="page-description">{event.albums.length} albums · {event._count.media} photos total</p>
      </div>

      <AlbumsClient
        event={{ id: event.id, slug: event.slug, title: event.title }}
        albums={event.albums as any}
        canManage={canManage}
      />
    </div>
  );
}
