// src/app/api/notifications/unread-count/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiSuccess({ count: 0 }));
    }

    const count = await prisma.notification.count({
      where: { recipientId: session.user.id, isRead: false },
    });

    return NextResponse.json(createApiSuccess({ count }));
  } catch (error) {
    console.error("[GET /api/notifications/unread-count]", error);
    return NextResponse.json(createApiError("Failed"), { status: 500 });
  }
}
