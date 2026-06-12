// src/app/api/media/[mediaId]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

interface Params {
  params: { mediaId: string };
}

// POST /api/media/:mediaId/like - Toggle like
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const { mediaId } = params;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { userId_mediaId: { userId: session.user.id, mediaId } },
      });
      const count = await prisma.like.count({ where: { mediaId } });
      return NextResponse.json(createApiSuccess({ liked: false, count }));
    }

    // Like
    await prisma.like.create({
      data: { userId: session.user.id, mediaId },
    });

    // Create notification for media owner
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { uploaderId: true },
    });

    if (media && media.uploaderId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "LIKE",
          recipientId: media.uploaderId,
          senderId: session.user.id,
          entityId: mediaId,
          entityType: "media",
          message: `${session.user.name} liked your photo`,
        },
      });
    }

    const count = await prisma.like.count({ where: { mediaId } });
    return NextResponse.json(createApiSuccess({ liked: true, count }));
  } catch (error) {
    console.error("[POST /api/media/:id/like]", error);
    return NextResponse.json(createApiError("Failed to toggle like"), {
      status: 500,
    });
  }
}
