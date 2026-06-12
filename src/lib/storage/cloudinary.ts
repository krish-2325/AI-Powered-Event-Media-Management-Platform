// src/lib/storage/cloudinary.ts
// Cloudinary free tier: 25 GB storage, 25 GB bandwidth/month, no credit card needed
// Sign up at: https://cloudinary.com/users/register/free

import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";

// Configure once — reads from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export type CloudinaryFolder = "media" | "thumbnails" | "avatars" | "covers";

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  resourceType: string;
  thumbnailUrl?: string;
}

/**
 * Upload a buffer directly to Cloudinary.
 * Used for server-side uploads (avatar, selfie).
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: CloudinaryFolder,
  options: {
    mimeType?: string;
    publicId?: string;
    transformation?: object[];
  } = {}
): Promise<CloudinaryUploadResult> {
  const publicId = options.publicId ?? `${folder}/${nanoid()}`;

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder,
        resource_type: "auto",
        transformation: options.transformation,
        // Auto-quality and format for images
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

  const thumbnailUrl =
    result.resource_type === "image"
      ? cloudinary.url(result.public_id, {
          width: 600,
          height: 600,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto",
        })
      : undefined;

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    resourceType: result.resource_type,
    thumbnailUrl,
  };
}

/**
 * Generate a signed upload URL for direct client-side upload.
 * The client uploads directly to Cloudinary — never touches our server.
 */
export function generateSignedUploadParams(
  folder: CloudinaryFolder,
  publicId?: string
): {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  folder: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const id = publicId ?? nanoid();
  const params = {
    folder,
    public_id: `${folder}/${id}`,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    publicId: `${folder}/${id}`,
    folder,
  };
}

/**
 * Delete a file from Cloudinary.
 */
export async function deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Delete multiple files.
 */
export async function deleteFiles(publicIds: string[]): Promise<void> {
  await Promise.allSettled(publicIds.map((id) => deleteFile(id)));
}

/**
 * Get a thumbnail URL for a Cloudinary image.
 */
export function getThumbnailUrl(publicId: string, width = 400, height = 400): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
}

/**
 * Apply watermark overlay on-the-fly using Cloudinary transformations.
 * Dynamic text: club name · event name · user role
 * No server processing needed — Cloudinary handles it at CDN level.
 */
export function getWatermarkedUrl(
  publicId: string,
  watermarkText: string,
  position: "south_east" | "center" | "south_west" = "south_east"
): string {
  const encodedText = encodeURIComponent(watermarkText);
  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      {
        overlay: {
          font_family: "Arial",
          font_size: 28,
          font_weight: "bold",
          text: encodedText,
        },
        color: "white",
        opacity: 60,
        gravity: position,
        x: 20,
        y: 20,
      },
      {
        overlay: {
          font_family: "Arial",
          font_size: 28,
          font_weight: "bold",
          text: encodedText,
        },
        color: "black",
        opacity: 30,
        gravity: position,
        x: 22,
        y: 22,
      },
    ],
    attachment: true, // forces browser download
  });
}

export { cloudinary };
