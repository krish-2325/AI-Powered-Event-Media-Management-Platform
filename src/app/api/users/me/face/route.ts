// src/app/api/users/me/face/route.ts
// Upload reference selfie for face recognition.
// Uses Cloudinary for storage (free), no AWS needed.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { uploadBuffer } from "@/lib/storage/cloudinary";
import { createApiError, createApiSuccess } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const formData = await req.formData();
    const selfieFile = formData.get("selfie") as File | null;

    if (!selfieFile) {
      return NextResponse.json(createApiError("No selfie file provided"), { status: 400 });
    }
    if (!selfieFile.type.startsWith("image/")) {
      return NextResponse.json(createApiError("File must be an image"), { status: 400 });
    }
    if (selfieFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(createApiError("Image must be under 5MB"), { status: 400 });
    }

    const arrayBuffer = await selfieFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload selfie to Cloudinary avatars folder
    const result = await uploadBuffer(buffer, "avatars", {
      publicId: `avatars/selfie_${session.user.id}`,
      mimeType: selfieFile.type,
      transformation: [
        { width: 256, height: 256, crop: "fill", gravity: "face" }, // auto-crop to face
      ],
    });

    // Store avatar URL in DB
    // Face descriptor is extracted CLIENT-SIDE via face-api.js (runs in browser)
    // The client calls PATCH /api/users/me with the descriptor after extraction
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: result.secureUrl },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_FACE_SELFIE",
        entityType: "user",
        entityId: session.user.id,
      },
    });

    return NextResponse.json(
      createApiSuccess({
        avatarUrl: result.secureUrl,
        message: "Selfie uploaded. Face recognition will run in your browser.",
      })
    );
  } catch (error) {
    console.error("[POST /api/users/me/face]", error);
    return NextResponse.json(createApiError("Failed to upload selfie"), { status: 500 });
  }
}
