// src/app/api/albums/[albumId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

interface Params { params: { albumId: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const album = await prisma.album.findUnique({
      where: { id: params.albumId },
      include: { event: { select: { ownerId: true } } },
    });

    if (!album) return NextResponse.json(createApiError("Album not found"), { status: 404 });

    const isOwner = album.event.ownerId === session.user.id;
    const userRole = session.user.role as UserRole;
    if (!isOwner && !hasRole(userRole, "ADMIN")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    // Unlink media from album but keep the media itself
    await prisma.media.updateMany({ where: { albumId: params.albumId }, data: { albumId: null } });
    await prisma.album.delete({ where: { id: params.albumId } });

    return NextResponse.json(createApiSuccess({ deleted: true }));
  } catch (error) {
    console.error("[DELETE /api/albums/:id]", error);
    return NextResponse.json(createApiError("Failed to delete album"), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json(createApiError("Unauthorized"), { status: 401 });

    const body = await req.json();
    const { name, description, accessLevel } = body;

    const album = await prisma.album.findUnique({
      where: { id: params.albumId },
      include: { event: { select: { ownerId: true } } },
    });

    if (!album) return NextResponse.json(createApiError("Album not found"), { status: 404 });

    const isOwner = album.event.ownerId === session.user.id;
    const userRole = session.user.role as UserRole;
    if (!isOwner && !hasRole(userRole, "PHOTOGRAPHER")) {
      return NextResponse.json(createApiError("Insufficient permissions"), { status: 403 });
    }

    const updated = await prisma.album.update({
      where: { id: params.albumId },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(accessLevel && { accessLevel }) },
    });

    return NextResponse.json(createApiSuccess(updated));
  } catch (error) {
    console.error("[PATCH /api/albums/:id]", error);
    return NextResponse.json(createApiError("Failed to update album"), { status: 500 });
  }
}
