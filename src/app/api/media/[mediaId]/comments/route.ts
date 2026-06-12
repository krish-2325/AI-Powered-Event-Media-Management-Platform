// src/app/api/media/[mediaId]/comments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createCommentSchema } from "@/lib/validations";
import { createApiError, createApiSuccess } from "@/lib/utils";

interface Params {
  params: { mediaId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { mediaId } = params;

    const comments = await prisma.comment.findMany({
      where: { mediaId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(createApiSuccess(comments));
  } catch (error) {
    console.error("[GET /api/media/:id/comments]", error);
    return NextResponse.json(createApiError("Failed to fetch comments"), { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const { mediaId } = params;
    const body = await req.json();
    const parsed = createCommentSchema.safeParse({ ...body, mediaId });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        userId: session.user.id,
        mediaId,
        parentId: parsed.data.parentId,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    // Notify media owner (if not self-comment)
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { uploaderId: true },
    });

    if (media && media.uploaderId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          recipientId: media.uploaderId,
          senderId: session.user.id,
          entityId: mediaId,
          entityType: "media",
          message: `${session.user.name} commented on your photo`,
        },
      });
    }

    return NextResponse.json(createApiSuccess(comment), { status: 201 });
  } catch (error) {
    console.error("[POST /api/media/:id/comments]", error);
    return NextResponse.json(createApiError("Failed to add comment"), { status: 500 });
  }
}
