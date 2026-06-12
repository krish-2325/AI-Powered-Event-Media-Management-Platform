// src/app/api/admin/moderation/[mediaId]/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import type { UserRole } from "@/lib/types/user";

interface Params { params: { mediaId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    if (!hasRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    // Remove the moderation flag from aiTags
    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      select: { aiTags: true },
    });

    if (!media) return NextResponse.json(createApiError("Not found"), { status: 404 });

    const cleanTags = media.aiTags.filter((t) => !t.startsWith("__FLAGGED_"));

    await prisma.media.update({
      where: { id: params.mediaId },
      data: { aiTags: cleanTags },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_APPROVE_MEDIA",
        entityType: "media",
        entityId: params.mediaId,
      },
    });

    return NextResponse.json(createApiSuccess({ approved: true }));
  } catch (error) {
    console.error("[POST /api/admin/moderation/:id/approve]", error);
    return NextResponse.json(createApiError("Failed to approve"), { status: 500 });
  }
}
