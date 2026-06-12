// src/app/api/admin/clubs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess, slugify } from "@/lib/utils";
import { z } from "zod";
import type { UserRole } from "@/lib/types/user";

const createClubSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }
    if (!hasRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const body = await req.json();
    const parsed = createClubSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;
    let slug = slugify(name);

    const existingSlug = await prisma.club.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const existingName = await prisma.club.findUnique({ where: { name } });
    if (existingName) {
      return NextResponse.json(
        createApiError("A club with this name already exists"),
        { status: 409 }
      );
    }

    const club = await prisma.club.create({
      data: { name, slug, description },
      include: { _count: { select: { members: true, events: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_CLUB",
        entityType: "club",
        entityId: club.id,
        metadata: { name, slug },
      },
    });

    return NextResponse.json(createApiSuccess(club), { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/clubs]", error);
    return NextResponse.json(createApiError("Failed to create club"), { status: 500 });
  }
}
