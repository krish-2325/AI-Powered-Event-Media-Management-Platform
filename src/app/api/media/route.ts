// src/app/api/media/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE), 100);
    const skip = (page - 1) * limit;
    const eventId = searchParams.get("eventId");
    const albumId = searchParams.get("albumId");
    const uploaderId = searchParams.get("uploaderId");
    const type = searchParams.get("type");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const q = searchParams.get("q");

    const accessFilter = session?.user
      ? { accessLevel: { in: ["PUBLIC", "MEMBERS_ONLY"] as const } }
      : { accessLevel: "PUBLIC" as const };

    const where = {
      ...accessFilter,
      ...(eventId && { eventId }),
      ...(albumId && { albumId }),
      ...(uploaderId && { uploaderId }),
      ...(type && { type }),
      ...(tags && tags.length > 0 && { aiTags: { hasSome: tags } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { aiCaption: { contains: q, mode: "insensitive" as const } },
          { aiTags: { hasSome: [q.toLowerCase()] } },
        ],
      }),
    };

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          uploader: { select: { id: true, name: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true, shares: true, favorites: true } },
        },
      }),
      prisma.media.count({ where }),
    ]);

    // Attach isLiked / isFavorited for authenticated users
    let enrichedMedia = media;
    if (session?.user) {
      const mediaIds = media.map((m) => m.id);
      const [likes, favorites] = await Promise.all([
        prisma.like.findMany({
          where: { userId: session.user.id, mediaId: { in: mediaIds } },
          select: { mediaId: true },
        }),
        prisma.favorite.findMany({
          where: { userId: session.user.id, mediaId: { in: mediaIds } },
          select: { mediaId: true },
        }),
      ]);

      const likedSet = new Set(likes.map((l) => l.mediaId));
      const favSet = new Set(favorites.map((f) => f.mediaId));

      enrichedMedia = media.map((m) => ({
        ...m,
        isLiked: likedSet.has(m.id),
        isFavorited: favSet.has(m.id),
      }));
    }

    return NextResponse.json(
      createApiSuccess({
        media: enrichedMedia,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      })
    );
  } catch (error) {
    console.error("[GET /api/media]", error);
    return NextResponse.json(createApiError("Failed to fetch media"), { status: 500 });
  }
}
