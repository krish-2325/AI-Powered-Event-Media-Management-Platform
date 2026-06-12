// src/app/api/media/[mediaId]/download/route.ts
// Download with dynamic watermark via Cloudinary CDN transformations.
// No S3, no AWS — Cloudinary applies watermark at CDN level for free.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { getWatermarkedUrl } from "@/lib/storage/cloudinary";
import { canAccessContent } from "@/lib/auth/helpers";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { AccessLevel } from "@/lib/types/event";
import type { UserRole } from "@/lib/types/user";

interface Params { params: { mediaId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      include: {
        event: { include: { club: { select: { name: true } } } },
      },
    });

    if (!media) return NextResponse.json(createApiError("Not found"), { status: 404 });

    const userRole = session?.user?.role as UserRole | undefined;
    const isOwner = session?.user?.id === media.uploaderId;

    if (!canAccessContent(userRole, media.accessLevel as AccessLevel, isOwner)) {
      return NextResponse.json(createApiError("Access denied"), { status: 403 });
    }

    const clubName  = media.event.club?.name ?? "PixVault";
    const eventName = media.event.title;
    const roleLabel = userRole?.replace(/_/g, " ").toLowerCase() ?? "viewer";
    const watermarkText = `${clubName}  ·  ${eventName}  ·  ${roleLabel}`;

    const position = media.accessLevel === "PRIVATE" ? "center" : "south_east";

    // Cloudinary applies watermark at CDN level — no server image processing
    const downloadUrl = getWatermarkedUrl(media.s3Key, watermarkText, position);

    // Track download
    if (session?.user) {
      await prisma.share
        .create({ data: { userId: session.user.id, mediaId: params.mediaId, platform: "download" } })
        .catch(() => {});
    }

    return NextResponse.json(createApiSuccess({
      url: downloadUrl,
      filename: `${media.title ?? `photo-${params.mediaId}`}.jpg`,
    }));
  } catch (error) {
    console.error("[GET /api/media/:id/download]", error);
    return NextResponse.json(createApiError("Download failed"), { status: 500 });
  }
}
