// src/app/events/[eventId]/page.tsx

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { EventDetailClient } from "@/components/events/event-detail-client";
import { canAccessContent } from "@/lib/auth/helpers";
import type { AccessLevel } from "@/lib/types/event";
import type { UserRole } from "@/lib/types/user";

interface Props {
  params: { eventId: string };
}

async function getEvent(slugOrId: string, userId?: string) {
  const event = await prisma.event.findFirst({
    where: {
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
    include: {
      owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      club: { select: { id: true, name: true, slug: true, logoUrl: true } },
      albums: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { media: true } } },
      },
      _count: { select: { media: true } },
    },
  });

  return event;
}

async function getEventMedia(eventId: string, userId?: string) {
  return prisma.media.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
    },
  });
}

export async function generateMetadata({ params }: Props) {
  const event = await prisma.event.findFirst({
    where: { OR: [{ slug: params.eventId }, { id: params.eventId }] },
    select: { title: true, description: true },
  });
  return {
    title: event?.title ?? "Event",
    description: event?.description ?? undefined,
  };
}

export default async function EventPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const event = await getEvent(params.eventId, session?.user?.id);

  if (!event) notFound();

  // Access control
  const userRole = session?.user?.role as UserRole | undefined;
  const isOwner = session?.user?.id === event.ownerId;

  if (!canAccessContent(userRole, event.accessLevel as AccessLevel, isOwner)) {
    notFound();
  }

  const media = await getEventMedia(event.id, session?.user?.id);

  return (
    <EventDetailClient
      event={event as any}
      media={media as any}
      currentUserId={session?.user?.id}
      isOwner={isOwner}
      userRole={userRole}
    />
  );
}
