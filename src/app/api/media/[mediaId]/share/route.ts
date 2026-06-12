// src/app/api/media/[mediaId]/share/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

interface Params {
  params: { mediaId: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    const { mediaId } = params;
    const body = await req.json().catch(() => ({}));
    const platform: string = body.platform ?? "link";

    // Record share event
    if (session?.user) {
      await prisma.share.create({
        data: { userId: session.user.id, mediaId, platform },
      });

      // Notify media owner
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
        select: { uploaderId: true },
      });

      if (media && media.uploaderId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: "SHARE",
            recipientId: media.uploaderId,
            senderId: session.user.id,
            entityId: mediaId,
            entityType: "media",
            message: `${session.user.name} shared your photo`,
          },
        });
      }
    }

    const shareCount = await prisma.share.count({ where: { mediaId } });

    // Return the shareable URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/media/${mediaId}`;
    return NextResponse.json(createApiSuccess({ shareUrl, shareCount }));
  } catch (error) {
    console.error("[POST /api/media/:id/share]", error);
    return NextResponse.json(createApiError("Failed to share"), { status: 500 });
  }
}
