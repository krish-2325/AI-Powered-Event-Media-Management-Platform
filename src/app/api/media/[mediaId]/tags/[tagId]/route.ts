// src/app/api/media/[mediaId]/tags/[tagId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";

interface Params { params: { mediaId: string; tagId: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const tag = await prisma.mediaTag.findUnique({ where: { id: params.tagId } });
    if (!tag) return NextResponse.json(createApiError("Tag not found"), { status: 404 });

    // Allow the tagger or the tagged user to remove the tag
    if (tag.taggerUserId !== session.user.id && tag.taggedUserId !== session.user.id) {
      return NextResponse.json(createApiError("Cannot remove this tag"), { status: 403 });
    }

    await prisma.mediaTag.delete({ where: { id: params.tagId } });
    return NextResponse.json(createApiSuccess({ deleted: true }));
  } catch (error) {
    return NextResponse.json(createApiError("Failed to remove tag"), { status: 500 });
  }
}
