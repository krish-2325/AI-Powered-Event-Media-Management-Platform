// src/app/api/ai/duplicates/route.ts
// Duplicate detection using pHash — runs locally with Sharp, no AWS needed

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { generatePHash, isDuplicate, hammingDistance } from "@/lib/ai/duplicate-detection";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const body = await req.json();
    const { mediaId, imageUrl } = body as { mediaId: string; imageUrl?: string };

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, originalUrl: true, type: true, eventId: true, uploaderId: true },
    });

    if (!media || media.type !== "IMAGE") {
      return NextResponse.json(createApiSuccess({ isDuplicate: false, skipped: true }));
    }

    const url = imageUrl ?? media.originalUrl;
    if (!url) {
      return NextResponse.json(createApiSuccess({ isDuplicate: false, skipped: true }));
    }

    // Fetch image and generate pHash
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(createApiSuccess({ isDuplicate: false, skipped: true }));
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const newHash = await generatePHash(buffer);

    // Get all other event images with stored pHash tags
    const existingMedia = await prisma.media.findMany({
      where: {
        eventId: media.eventId,
        type: "IMAGE",
        NOT: { id: mediaId },
      },
      select: { id: true, aiTags: true },
      take: 200,
    });

    const duplicates: Array<{ mediaId: string; distance: number }> = [];

    for (const existing of existingMedia) {
      const hashTag = existing.aiTags.find((t) => t.startsWith("phash:"));
      if (!hashTag) continue;
      const existingHash = hashTag.replace("phash:", "");
      if (isDuplicate(newHash, existingHash)) {
        duplicates.push({ mediaId: existing.id, distance: hammingDistance(newHash, existingHash) });
      }
    }

    // Store pHash in aiTags
    await prisma.media.update({
      where: { id: mediaId },
      data: { aiTags: { push: `phash:${newHash}` } },
    });

    if (duplicates.length > 0) {
      await prisma.notification.create({
        data: {
          type: "SYSTEM",
          recipientId: session.user.id,
          entityId: mediaId,
          entityType: "media",
          message: `Duplicate detected: this photo looks similar to ${duplicates.length} existing photo${duplicates.length > 1 ? "s" : ""} in this event`,
        },
      });
    }

    return NextResponse.json(
      createApiSuccess({
        mediaId,
        pHash: newHash,
        isDuplicate: duplicates.length > 0,
        duplicates: duplicates.sort((a, b) => a.distance - b.distance).slice(0, 3),
      })
    );
  } catch (error) {
    console.error("[POST /api/ai/duplicates]", error);
    return NextResponse.json(createApiError("Duplicate check failed"), { status: 500 });
  }
}
