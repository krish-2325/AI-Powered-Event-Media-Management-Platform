// src/app/api/media/[mediaId]/favorite/route.ts

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
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const { mediaId } = params;

    const existing = await prisma.favorite.findUnique({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_mediaId: { userId: session.user.id, mediaId } },
      });
      return NextResponse.json(createApiSuccess({ favorited: false }));
    }

    await prisma.favorite.create({
      data: { userId: session.user.id, mediaId },
    });

    return NextResponse.json(createApiSuccess({ favorited: true }));
  } catch (error) {
    console.error("[POST /api/media/:id/favorite]", error);
    return NextResponse.json(createApiError("Failed to toggle favorite"), { status: 500 });
  }
}
