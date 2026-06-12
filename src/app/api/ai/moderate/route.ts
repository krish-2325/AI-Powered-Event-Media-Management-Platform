// src/app/api/ai/moderate/route.ts
// Image moderation using NSFW.js — completely free, runs locally, no API key

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { moderateImage } from "@/lib/ai/image-moderation";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const body = await req.json();
    const { mediaId, imageUrl } = body as { mediaId: string; imageUrl?: string };

    if (!mediaId) {
      return NextResponse.json(createApiError("mediaId required"), { status: 400 });
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, originalUrl: true, type: true, uploaderId: true },
    });

    if (!media || media.type !== "IMAGE") {
      return NextResponse.json(createApiSuccess({ isSafe: true, skipped: true }));
    }

    const url = imageUrl ?? media.originalUrl;
    if (!url) {
      return NextResponse.json(createApiSuccess({ isSafe: true, skipped: true }));
    }

    const result = await moderateImage(url);

    if (!result.isSafe) {
      // Flag media
      await prisma.media.update({
        where: { id: mediaId },
        data: { aiTags: { push: "__FLAGGED_MODERATION__" } },
      });

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            type: "SYSTEM" as const,
            recipientId: admin.id,
            entityId: mediaId,
            entityType: "media",
            message: `Content moderation flagged a photo (${result.flaggedCategories.join(", ")})`,
          })),
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: media.uploaderId,
          action: "MEDIA_FLAGGED",
          entityType: "media",
          entityId: mediaId,
          metadata: { flaggedCategories: result.flaggedCategories, confidence: result.confidence } as any,
        },
      });
    }

    await prisma.job.create({
      data: {
        type: "moderate",
        payload: { mediaId } as any,
        status: "COMPLETED",
        result: result as any,
      },
    });

    return NextResponse.json(createApiSuccess({ mediaId, ...result }));
  } catch (error) {
    console.error("[POST /api/ai/moderate]", error);
    return NextResponse.json(createApiError("Moderation failed"), { status: 500 });
  }
}
