// src/app/api/events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { createEventSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { createApiError, createApiSuccess } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// GET /api/events - List events with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);
    const category = searchParams.get("category");
    const status = searchParams.get("status") ?? "PUBLISHED";
    const clubId = searchParams.get("clubId");
    const ownerId = searchParams.get("ownerId");
    const q = searchParams.get("q");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const skip = (page - 1) * limit;

    // Build access filter based on auth state
    const accessFilter = session?.user
      ? { accessLevel: { in: ["PUBLIC", "MEMBERS_ONLY"] as const } }
      : { accessLevel: "PUBLIC" as const };

    const where = {
      ...accessFilter,
      ...(status && { status }),
      ...(category && { category }),
      ...(clubId && { clubId }),
      ...(ownerId && { ownerId }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          club: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          _count: {
            select: { media: true, albums: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json(
      createApiSuccess({
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      })
    );
  } catch (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json(createApiError("Failed to fetch events"), {
      status: 500,
    });
  }
}

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    // Check role
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(createApiError("Insufficient permissions"), {
        status: 403,
      });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, description, category, accessLevel, location, startDate, endDate, clubId } =
      parsed.data;

    // Generate unique slug
    let slug = slugify(title);
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        category,
        accessLevel,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ownerId: session.user.id,
        clubId,
        status: "DRAFT",
      },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        club: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        _count: { select: { media: true, albums: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_EVENT",
        entityType: "event",
        entityId: event.id,
        metadata: { title, category },
      },
    });

    return NextResponse.json(createApiSuccess(event), { status: 201 });
  } catch (error) {
    console.error("[POST /api/events]", error);
    return NextResponse.json(createApiError("Failed to create event"), {
      status: 500,
    });
  }
}
