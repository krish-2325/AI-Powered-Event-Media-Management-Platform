// src/app/api/notifications/read-all/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const { count } = await prisma.notification.updateMany({
      where: { recipientId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json(createApiSuccess({ updated: count }));
  } catch (error) {
    console.error("[POST /api/notifications/read-all]", error);
    return NextResponse.json(createApiError("Failed"), { status: 500 });
  }
}
