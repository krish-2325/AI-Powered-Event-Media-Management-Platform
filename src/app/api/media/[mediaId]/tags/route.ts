// src/app/api/media/[mediaId]/tags/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { z } from "zod";

interface Params { params: { mediaId: string } }

const tagSchema = z.object({
  taggedUserId: z.string().cuid(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const tags = await prisma.mediaTag.findMany({
      where: { mediaId: params.mediaId },
      include: { taggedUser: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    return NextResponse.json(createApiSuccess(tags));
  } catch (error) {
    return NextResponse.json(createApiError("Failed to fetch tags"), { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const body = await req.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });

    const { taggedUserId, x, y } = parsed.data;
    const { mediaId } = params;

    // Check not already tagged
    const existing = await prisma.mediaTag.findUnique({
      where: { mediaId_taggedUserId: { mediaId, taggedUserId } },
    });
    if (existing) return NextResponse.json(createApiError("User already tagged"), { status: 409 });

    const tag = await prisma.mediaTag.create({
      data: { mediaId, taggedUserId, taggerUserId: session.user.id, x, y },
      include: { taggedUser: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });

    // Notify the tagged user
    if (taggedUserId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "TAG",
          recipientId: taggedUserId,
          senderId: session.user.id,
          entityId: mediaId,
          entityType: "media",
          message: `${session.user.name} tagged you in a photo`,
        },
      });
    }

    return NextResponse.json(createApiSuccess(tag), { status: 201 });
  } catch (error) {
    console.error("[POST /api/media/:id/tags]", error);
    return NextResponse.json(createApiError("Failed to add tag"), { status: 500 });
  }
}
