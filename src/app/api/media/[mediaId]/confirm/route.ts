// src/app/api/media/[mediaId]/confirm/route.ts
// Called after Cloudinary upload completes.
// Client sends back the Cloudinary public_id and secure_url.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { getThumbnailUrl } from "@/lib/storage/cloudinary";
import { createApiError, createApiSuccess } from "@/lib/utils";

interface Params { params: { mediaId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const body = await req.json();
    const { publicId, secureUrl, width, height } = body as {
      publicId: string;
      secureUrl: string;
      width?: number;
      height?: number;
    };

    if (!publicId || !secureUrl) {
      return NextResponse.json(createApiError("publicId and secureUrl required"), { status: 400 });
    }

    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      select: { id: true, uploaderId: true, type: true },
    });

    if (!media) return NextResponse.json(createApiError("Not found"), { status: 404 });
    if (media.uploaderId !== session.user.id) {
      return NextResponse.json(createApiError("Forbidden"), { status: 403 });
    }

    // Generate thumbnail URL via Cloudinary transformations
    const thumbnailUrl = media.type === "IMAGE"
      ? getThumbnailUrl(publicId, 600, 600)
      : getThumbnailUrl(publicId, 600, 600); // Cloudinary handles video thumbnails too

    // Update media record with real URLs
    await prisma.media.update({
      where: { id: params.mediaId },
      data: {
        s3Key: publicId,         // publicId stored here
        originalUrl: secureUrl,
        thumbnailUrl,
        width: width ?? null,
        height: height ?? null,
        updatedAt: new Date(),
      },
    });

    // Kick off AI pipeline (fire and forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const cookie = req.headers.get("cookie") ?? "";
    const headers = { "Content-Type": "application/json", Cookie: cookie };
    const body2 = JSON.stringify({ mediaId: params.mediaId, imageUrl: secureUrl });

    if (media.type === "IMAGE") {
      Promise.allSettled([
        fetch(`${appUrl}/api/ai/tag`,        { method: "POST", headers, body: body2 }),
        fetch(`${appUrl}/api/ai/moderate`,   { method: "POST", headers, body: body2 }),
        fetch(`${appUrl}/api/ai/duplicates`, { method: "POST", headers, body: body2 }),
      ]).catch(() => {});
    }

    return NextResponse.json(createApiSuccess({ mediaId: params.mediaId, confirmed: true }));
  } catch (error) {
    console.error("[POST /api/media/:id/confirm]", error);
    return NextResponse.json(createApiError("Failed to confirm upload"), { status: 500 });
  }
}
