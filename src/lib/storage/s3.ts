// src/lib/storage/s3.ts
// NOTE: This project now uses Cloudinary instead of AWS S3.
// This file is kept for backward compatibility with the Prisma schema
// which uses s3Key/s3Bucket field names (they now store Cloudinary publicId/provider).
// All actual upload/download logic is in src/lib/storage/cloudinary.ts

/**
 * @deprecated Use cloudinary.ts instead
 * s3Key in the database now stores the Cloudinary publicId
 * s3Bucket in the database now stores "cloudinary" as the provider name
 */
export const STORAGE_PROVIDER = "cloudinary";

export function isCloudinaryKey(s3Key: string): boolean {
  return !s3Key.startsWith("media/demo/");
}
