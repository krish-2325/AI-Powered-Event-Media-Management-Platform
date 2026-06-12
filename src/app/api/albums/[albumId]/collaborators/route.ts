// src/app/api/albums/[albumId]/collaborators/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { z } from "zod";

interface Params { params: { albumId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const collaborators = await prisma.albumCollaborator.findMany({
      where: { albumId: params.albumId },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true, role: true } },
      },
    });
    return NextResponse.json(createApiSuccess(collaborators));
  } catch (error) {
    return NextResponse.json(createApiError("Failed to fetch collaborators"), { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const body = await req.json();
    const { userId, canUpload = true } = z.object({
      userId: z.string().cuid(),
      canUpload: z.boolean().default(true),
    }).parse(body);

    // Verify album exists and requester is owner/admin
    const album = await prisma.album.findUnique({
      where: { id: params.albumId },
      include: { event: { select: { ownerId: true } } },
    });

    if (!album) return NextResponse.json(createApiError("Album not found"), { status: 404 });
    if (album.event.ownerId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const collab = await prisma.albumCollaborator.upsert({
      where: { albumId_userId: { albumId: params.albumId, userId } },
      create: { albumId: params.albumId, userId, canUpload },
      update: { canUpload },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        type: "EVENT_INVITE",
        recipientId: userId,
        senderId: session.user.id,
        entityId: params.albumId,
        entityType: "album",
        message: `${session.user.name} invited you to collaborate on "${album.name}"`,
      },
    });

    return NextResponse.json(createApiSuccess(collab), { status: 201 });
  } catch (error) {
    console.error("[POST /api/albums/:id/collaborators]", error);
    return NextResponse.json(createApiError("Failed to add collaborator"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json(createApiError("userId required"), { status: 400 });

    await prisma.albumCollaborator.delete({
      where: { albumId_userId: { albumId: params.albumId, userId } },
    });

    return NextResponse.json(createApiSuccess({ removed: true }));
  } catch (error) {
    return NextResponse.json(createApiError("Failed to remove collaborator"), { status: 500 });
  }
}
