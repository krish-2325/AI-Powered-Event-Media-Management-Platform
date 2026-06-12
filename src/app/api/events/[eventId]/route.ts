// src/app/api/events/[eventId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { updateEventSchema } from "@/lib/validations";
import { createApiError, createApiSuccess, slugify } from "@/lib/utils";
import { deleteFiles } from "@/lib/storage/cloudinary";
import { hasRole as authHasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

interface Params {
  params: { eventId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const event = await prisma.event.findFirst({
      where: { OR: [{ id: params.eventId }, { slug: params.eventId }] },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        albums: { include: { _count: { select: { media: true } } } },
        _count: { select: { media: true } },
      },
    });

    if (!event) {
      return NextResponse.json(createApiError("Event not found"), { status: 404 });
    }

    return NextResponse.json(createApiSuccess(event));
  } catch (error) {
    console.error("[GET /api/events/:id]", error);
    return NextResponse.json(createApiError("Failed to fetch event"), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { OR: [{ id: params.eventId }, { slug: params.eventId }] },
      select: { id: true, ownerId: true, slug: true, title: true },
    });

    if (!event) {
      return NextResponse.json(createApiError("Event not found"), { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const isOwner = session.user.id === event.ownerId;
    if (!isOwner && !authHasRole(userRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Re-slug if title changed
    let newSlug = event.slug;
    if (data.title && data.title !== event.title) {
      const candidate = slugify(data.title);
      const existing = await prisma.event.findFirst({
        where: { slug: candidate, NOT: { id: event.id } },
      });
      newSlug = existing ? `${candidate}-${Date.now()}` : candidate;
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        ...data,
        slug: newSlug,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        club: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { media: true } },
      },
    });

    return NextResponse.json(createApiSuccess(updated));
  } catch (error) {
    console.error("[PATCH /api/events/:id]", error);
    return NextResponse.json(createApiError("Failed to update event"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { OR: [{ id: params.eventId }, { slug: params.eventId }] },
      include: {
        media: { select: { s3Key: true } },
      },
    });

    if (!event) {
      return NextResponse.json(createApiError("Event not found"), { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const isOwner = session.user.id === event.ownerId;
    if (!isOwner && !authHasRole(userRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    // Delete S3 objects for all media in the event
    if (event.media.length > 0) {
      // Only delete real Cloudinary uploads, not demo seed URLs
      const keys = event.media
        .filter((m) => m.s3Bucket === "cloudinary" && !m.s3Key.startsWith("media/demo"))
        .map((m) => m.s3Key);
      if (keys.length > 0) {
        await deleteFiles(keys).catch((err) =>
          console.error("Failed to delete Cloudinary files:", err)
        );
      }
    }

    // Delete event (cascades to media, albums, etc. via Prisma)
    await prisma.event.delete({ where: { id: event.id } });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_EVENT",
        entityType: "event",
        entityId: event.id,
        metadata: { title: event.title },
      },
    });

    return NextResponse.json(createApiSuccess({ deleted: true }));
  } catch (error) {
    console.error("[DELETE /api/events/:id]", error);
    return NextResponse.json(createApiError("Failed to delete event"), { status: 500 });
  }
}
