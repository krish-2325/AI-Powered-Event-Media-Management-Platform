// src/app/api/users/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 20);

    if (!q || q.length < 2) return NextResponse.json(createApiSuccess([]));

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        NOT: { id: session.user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, name: true, username: true, avatarUrl: true },
    });

    return NextResponse.json(createApiSuccess(users));
  } catch (error) {
    return NextResponse.json(createApiError("Search failed"), { status: 500 });
  }
}
