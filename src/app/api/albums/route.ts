// src/app/api/albums/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createAlbumSchema } from "@/lib/validations";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const body = await req.json();
    const parsed = createAlbumSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { name, description, accessLevel, eventId } = parsed.data;

    // Verify user can manage this event
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ownerId: true } });
    if (!event) return NextResponse.json(createApiError("Event not found"), { status: 404 });

    const isOwner = event.ownerId === session.user.id;
    const userRole = session.user.role as UserRole;
    if (!isOwner && !hasRole(userRole, "PHOTOGRAPHER")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const album = await prisma.album.create({
      data: { name, description, accessLevel, eventId },
      include: { _count: { select: { media: true } } },
    });

    return NextResponse.json(createApiSuccess(album), { status: 201 });
  } catch (error) {
    console.error("[POST /api/albums]", error);
    return NextResponse.json(createApiError("Failed to create album"), { status: 500 });
  }
}
