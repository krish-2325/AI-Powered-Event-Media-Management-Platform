// src/app/api/stories/[storyId]/view/route.ts
// Record a story view

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiSuccess } from "@/lib/utils";

interface Params { params: { storyId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiSuccess({ recorded: false }));

    await prisma.storyView.upsert({
      where: { userId_storyId: { userId: session.user.id, storyId: params.storyId } },
      create: { userId: session.user.id, storyId: params.storyId },
      update: { viewedAt: new Date() },
    });

    return NextResponse.json(createApiSuccess({ recorded: true }));
  } catch {
    return NextResponse.json(createApiSuccess({ recorded: false }));
  }
}
