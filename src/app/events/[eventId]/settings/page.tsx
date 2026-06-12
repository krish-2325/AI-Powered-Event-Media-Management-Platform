// src/app/events/[eventId]/settings/page.tsx

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { EventSettingsClient } from "@/components/events/event-settings-client";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

export const metadata = { title: "Event Settings" };

interface Props {
  params: { eventId: string };
}

export default async function EventSettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const event = await prisma.event.findFirst({
    where: { OR: [{ slug: params.eventId }, { id: params.eventId }] },
    include: {
      club: { select: { id: true, name: true, slug: true } },
      _count: { select: { media: true } },
    },
  });

  if (!event) notFound();

  const userRole = session.user.role as UserRole;
  const isOwner = session.user.id === event.ownerId;
  const canEdit = isOwner || hasRole(userRole, "ADMIN");

  if (!canEdit) redirect(`/events/${event.slug}`);

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Event Settings</h1>
        <p className="page-description">{event.title}</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <EventSettingsClient event={event as any} />
      </div>
    </div>
  );
}
