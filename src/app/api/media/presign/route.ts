// src/app/api/media/presign/route.ts
// Generates Cloudinary signed upload params for direct client-side upload.
// Replaces AWS S3 presigned URLs — completely free with Cloudinary.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";
import { generateSignedUploadParams } from "@/lib/storage/cloudinary";
import { createApiError, createApiSuccess, isAllowedMediaType, getMaxFileSize } from "@/lib/utils";
import { z } from "zod";

const presignSchema = z.object({
  eventId: z.string().cuid(),
  albumId: z.string().cuid().optional(),
  files: z.array(
    z.object({ name: z.string(), type: z.string(), size: z.number() })
  ).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(createApiError("Unauthorized"), { status: 401 });
    }

    const body = await req.json();
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { eventId, albumId, files } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, ownerId: true, accessLevel: true },
    });
    if (!event) return NextResponse.json(createApiError("Event not found"), { status: 404 });

    // Validate file types and sizes
    for (const file of files) {
      if (!isAllowedMediaType(file.type)) {
        return NextResponse.json(
          createApiError(`File type ${file.type} is not allowed`), { status: 400 }
        );
      }
      if (file.size > getMaxFileSize(file.type)) {
        return NextResponse.json(
          createApiError(`${file.name} is too large`), { status: 400 }
        );
      }
    }

    // Generate Cloudinary upload params + create pending DB records
    const results = await Promise.all(
      files.map(async (file) => {
        const isVideo = file.type.startsWith("video/");
        const folder = isVideo ? "media" : "media";

        // Generate signed params for direct client upload
        const uploadParams = generateSignedUploadParams(folder);

        // Create pending DB record
        const media = await prisma.media.create({
          data: {
            type: isVideo ? "VIDEO" : "IMAGE",
            // Will be updated after upload completes
            s3Key: uploadParams.publicId,   // We store publicId in s3Key field
            s3Bucket: "cloudinary",          // Mark as cloudinary
            originalUrl: "",                 // Set after upload confirm
            fileSize: file.size,
            mimeType: file.type,
            uploaderId: session.user.id,
            eventId,
            albumId,
            accessLevel: event.accessLevel as any,
          },
        });

        return {
          mediaId: media.id,
          // Client uses these to upload directly to Cloudinary
          uploadUrl: uploadParams.uploadUrl,
          signature: uploadParams.signature,
          timestamp: uploadParams.timestamp,
          apiKey: uploadParams.apiKey,
          cloudName: uploadParams.cloudName,
          publicId: uploadParams.publicId,
          folder: uploadParams.folder,
          fileName: file.name,
        };
      })
    );

    return NextResponse.json(createApiSuccess(results), { status: 200 });
  } catch (error) {
    console.error("[POST /api/media/presign]", error);
    return NextResponse.json(createApiError("Failed to generate upload params"), { status: 500 });
  }
}
