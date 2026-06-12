// src/app/api/admin/moderation/route.ts
// Fetch all flagged media for admin review

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { UserRole } from "@/lib/types/user";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    if (!hasRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: {
          aiTags: { has: "__FLAGGED_MODERATION__" },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          uploader: { select: { id: true, name: true, username: true } },
          event: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.media.count({ where: { aiTags: { has: "__FLAGGED_MODERATION__" } } }),
    ]);

    return NextResponse.json(
      createApiSuccess({
        media,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    );
  } catch (error) {
    console.error("[GET /api/admin/moderation]", error);
    return NextResponse.json(createApiError("Failed to fetch flagged media"), { status: 500 });
  }
}
