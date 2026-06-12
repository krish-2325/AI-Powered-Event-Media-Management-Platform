// src/app/api/media/[mediaId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { deleteFile } from "@/lib/storage/cloudinary";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

interface Params { params: { mediaId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      include: {
        uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
        event: { select: { id: true, title: true, slug: true } },
        tags: { include: { taggedUser: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
        _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
      },
    });
    if (!media) return NextResponse.json(createApiError("Not found"), { status: 404 });
    return NextResponse.json(createApiSuccess(media));
  } catch (error) {
    return NextResponse.json(createApiError("Failed to fetch media"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      select: { id: true, uploaderId: true, s3Key: true, s3Bucket: true },
    });
    if (!media) return NextResponse.json(createApiError("Not found"), { status: 404 });

    const isOwner = media.uploaderId === session.user.id;
    if (!isOwner && !hasRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    // Delete from Cloudinary if it was a real upload (not a demo seed URL)
    if (media.s3Bucket === "cloudinary" && media.s3Key && !media.s3Key.startsWith("media/demo")) {
      await deleteFile(media.s3Key).catch(() => {});
    }

    await prisma.media.delete({ where: { id: params.mediaId } });
    return NextResponse.json(createApiSuccess({ deleted: true }));
  } catch (error) {
    console.error("[DELETE /api/media/:id]", error);
    return NextResponse.json(createApiError("Failed to delete media"), { status: 500 });
  }
}
