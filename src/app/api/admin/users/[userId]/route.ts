// src/app/api/admin/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { hasRole } from "@/lib/auth/helpers";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { z } from "zod";
import type { UserRole } from "@/lib/types/user";

const updateUserSchema = z.object({
  role: z
    .enum(["VIEWER", "CLUB_MEMBER", "PHOTOGRAPHER", "ADMIN", "SUPER_ADMIN"])
    .optional(),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
});

interface Params {
  params: { userId: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }
    if (!hasRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId } = params;

    // Prevent self-demotion
    if (userId === session.user.id && parsed.data.role !== undefined) {
      return NextResponse.json(
        createApiError("You cannot change your own role"),
        { status: 403 }
      );
    }

    // Prevent modifying SUPER_ADMIN unless you are one
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      targetUser?.role === "SUPER_ADMIN" &&
      !hasRole(session.user.role as UserRole, "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        createApiError("Cannot modify a Super Admin"),
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.role && { role: parsed.data.role }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
        ...(parsed.data.isBanned !== undefined && { isBanned: parsed.data.isBanned }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_UPDATE_USER",
        entityType: "user",
        entityId: userId,
        metadata: parsed.data,
      },
    });

    return NextResponse.json(createApiSuccess(updated));
  } catch (error) {
    console.error("[PATCH /api/admin/users/:id]", error);
    return NextResponse.json(createApiError("Failed to update user"), { status: 500 });
  }
}
