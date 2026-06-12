// src/app/api/users/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { updateProfileSchema } from "@/lib/validations";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          include: {
            club: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        },
        _count: {
          select: {
            uploadedMedia: true,
            followers: true,
            following: true,
            ownedEvents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(createApiError("User not found"), { status: 404 });
    }

    return NextResponse.json(createApiSuccess(user));
  } catch (error) {
    console.error("[GET /api/users/me]", error);
    return NextResponse.json(createApiError("Failed to fetch user"), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, username, bio } = parsed.data;

    // Check username uniqueness if changing
    if (username && username !== session.user.username) {
      const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          createApiError("Username is already taken"),
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(username && { username: username.toLowerCase() }),
        ...(bio !== undefined && { bio }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PROFILE",
        entityType: "user",
        entityId: session.user.id,
      },
    });

    return NextResponse.json(createApiSuccess(updated));
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return NextResponse.json(createApiError("Failed to update profile"), { status: 500 });
  }
}
