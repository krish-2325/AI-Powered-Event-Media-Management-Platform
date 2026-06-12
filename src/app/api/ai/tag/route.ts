// src/app/api/ai/tag/route.ts
// AI tagging using Hugging Face free API — no AWS, no credit card

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { detectImageLabels, generateCaption, generateCaptionFromLabels } from "@/lib/ai/image-tagging";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

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

    if (!media) {
      return NextResponse.json(createApiError("Media not found"), { status: 404 });
    }

    // Only process images
    if (media.type !== "IMAGE") {
      return NextResponse.json(createApiSuccess({ skipped: "video" }));
    }

    const url = imageUrl ?? media.originalUrl;
    if (!url) {
      return NextResponse.json(createApiSuccess({ skipped: "no url" }));
    }

    // Run label detection + caption generation in parallel
    const [labels, aiCaption] = await Promise.all([
      detectImageLabels(url),
      generateCaption(url),
    ]);

    const tags = labels
      .filter((l) => l.confidence >= 10)
      .map((l) => l.name)
      .slice(0, 15);

    const caption = aiCaption || generateCaptionFromLabels(labels);

    // Update media record
    await prisma.media.update({
      where: { id: mediaId },
      data: { aiTags: tags, aiCaption: caption },
    });

    // Log job
    await prisma.job.create({
      data: {
        type: "ai_tag",
        payload: { mediaId },
        status: "COMPLETED",
        result: { tags, caption } as any,
      },
    });

    return NextResponse.json(createApiSuccess({ mediaId, tags, caption }));
  } catch (error) {
    console.error("[POST /api/ai/tag]", error);
    await prisma.job.create({
      data: {
        type: "ai_tag",
        payload: {},
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown",
      },
    }).catch(() => {});
    return NextResponse.json(createApiError("AI tagging failed"), { status: 500 });
  }
}
