// src/app/api/stories/route.ts
// Story/Highlight feature — 24-hour expiring stories for events

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { z } from "zod";

const createStorySchema = z.object({
  mediaId: z.string().cuid(),
  eventId: z.string().cuid(),
  caption: z.string().max(200).optional(),
  durationSeconds: z.number().min(3).max(15).default(5),
});

// GET /api/stories — fetch active stories (< 24h old) for current user's events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        createdAt: { gte: cutoff },
        ...(eventId && { eventId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        media: { select: { id: true, originalUrl: true, thumbnailUrl: true, type: true, width: true, height: true } },
        event: { select: { id: true, title: true, slug: true } },
        _count: { select: { views: true } },
      },
    });

    // Mark stories seen by current user
    const seenIds = session?.user
      ? (
          await prisma.storyView.findMany({
            where: { userId: session.user.id, storyId: { in: stories.map((s) => s.id) } },
            select: { storyId: true },
          })
        ).map((v) => v.storyId)
      : [];

    const result = stories.map((s) => ({
      ...s,
      isSeen: seenIds.includes(s.id),
    }));

    return NextResponse.json(createApiSuccess(result));
  } catch (error) {
    console.error("[GET /api/stories]", error);
    return NextResponse.json(createApiError("Failed to fetch stories"), { status: 500 });
  }
}

// POST /api/stories — create a new story from existing media
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const body = await req.json();
    const parsed = createStorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mediaId, eventId, caption, durationSeconds } = parsed.data;

    // Verify media belongs to this event
    const media = await prisma.media.findFirst({
      where: { id: mediaId, eventId },
      select: { id: true },
    });
    if (!media) return NextResponse.json(createApiError("Media not found in this event"), { status: 404 });

    const story = await prisma.story.create({
      data: {
        authorId: session.user.id,
        mediaId,
        eventId,
        caption,
        durationSeconds,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        media: { select: { id: true, originalUrl: true, thumbnailUrl: true, type: true } },
        event: { select: { id: true, title: true, slug: true } },
        _count: { select: { views: true } },
      },
    });

    return NextResponse.json(createApiSuccess(story), { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories]", error);
    return NextResponse.json(createApiError("Failed to create story"), { status: 500 });
  }
}
